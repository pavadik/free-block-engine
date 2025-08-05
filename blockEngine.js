/**
 * Free Block Engine - Advanced Visual Block Management System
 * 
 * A powerful JavaScript library for creating, managing, and visualizing
 * interconnected blocks with drag-and-drop, resizing, and relationship management.
 * 
 * @author Paul Dikaloff
 * @version 1.0.0
 * @license MIT
 * @repository https://github.com/pavadik/free-block-engine
 * 
 * Features:
 * - Free positioning with drag & drop
 * - Dynamic block resizing
 * - Smart connection routing
 * - Bidirectional relationships
 * - Real-time visual feedback
 * - Import/Export functionality
 * - Responsive design
 * 
 * Created: 2025-08-05
 */

class Block {
  constructor(id, content = '', type = 'default') {
    this.id = id;
    this.content = content;
    this.type = type;
    this.links = new Map(); // Map of block IDs to link metadata
    this.position = { x: 0, y: 0 }; // Position for free positioning
    this.size = { width: 250, height: 250 }; // Default size
    this.metadata = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  setContent(content) {
    this.content = content;
    this.metadata.updatedAt = new Date().toISOString();
  }

  setPosition(x, y) {
    this.position.x = x;
    this.position.y = y;
    this.metadata.updatedAt = new Date().toISOString();
  }

  setSize(width, height) {
    this.size.width = width;
    this.size.height = height;
    this.metadata.updatedAt = new Date().toISOString();
  }

  addLink(blockId, linkType = 'single') {
    this.links.set(blockId, {
      type: linkType,
      createdAt: new Date().toISOString()
    });
    this.metadata.updatedAt = new Date().toISOString();
  }

  removeLink(blockId) {
    this.links.delete(blockId);
    this.metadata.updatedAt = new Date().toISOString();
  }

  hasLink(blockId) {
    return this.links.has(blockId);
  }

  getLinkType(blockId) {
    const link = this.links.get(blockId);
    return link ? link.type : null;
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      type: this.type,
      links: Array.from(this.links.entries()).map(([id, meta]) => ({
        id,
        ...meta
      })),
      position: this.position,
      size: this.size,
      metadata: this.metadata
    };
  }
}

class BlockEngine {
  constructor() {
    this.blocks = new Map();
    this.eventListeners = new Map();
    this.settings = {
      gridSize: 20, // For snapping to grid
      defaultSpacing: 300, // Default spacing between auto-positioned blocks
      minBlockWidth: 150,
      minBlockHeight: 100
    };
  }

  /**
   * Create a new block
   * @param {string} content - The content of the block
   * @param {string} type - The type of block (default, note, task, etc.)
   * @param {object} position - Optional position {x, y}
   * @param {object} size - Optional size {width, height}
   * @returns {Block} The created block
   */
  createBlock(content = '', type = 'default', position = null, size = null) {
    const id = this.generateId();
    const block = new Block(id, content, type);
    
    // Set position
    if (position) {
      block.setPosition(position.x, position.y);
    } else {
      // Auto-position new blocks
      const autoPos = this.getAutoPosition();
      block.setPosition(autoPos.x, autoPos.y);
    }
    
    // Set size
    if (size) {
      block.setSize(size.width, size.height);
    }
    
    this.blocks.set(id, block);
    this.emit('blockCreated', block);
    return block;
  }

  /**
   * Get auto-position for new blocks
   * @returns {object} Position {x, y}
   */
  getAutoPosition() {
    const blocks = this.getAllBlocks();
    if (blocks.length === 0) {
      return { x: 50, y: 50 };
    }
    
    // Find rightmost block
    let maxX = 0;
    let maxY = 50;
    
    blocks.forEach(block => {
      if (block.position.x > maxX) {
        maxX = block.position.x;
        maxY = block.position.y;
      }
    });
    
    // Place new block to the right
    return { 
      x: maxX + this.settings.defaultSpacing, 
      y: maxY 
    };
  }

  /**
   * Update block position
   * @param {string} id - The block ID
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {boolean} snapToGrid - Whether to snap to grid
   * @returns {boolean} Success status
   */
  setBlockPosition(id, x, y, snapToGrid = true) {
    const block = this.getBlock(id);
    if (!block) return false;
    
    if (snapToGrid) {
      x = Math.round(x / this.settings.gridSize) * this.settings.gridSize;
      y = Math.round(y / this.settings.gridSize) * this.settings.gridSize;
    }
    
    block.setPosition(x, y);
    this.emit('blockMoved', block);
    return true;
  }

  /**
   * Update block size
   * @param {string} id - The block ID
   * @param {number} width - Width
   * @param {number} height - Height
   * @returns {boolean} Success status
   */
  setBlockSize(id, width, height) {
    const block = this.getBlock(id);
    if (!block) return false;
    
    // Enforce minimum size
    width = Math.max(width, this.settings.minBlockWidth);
    height = Math.max(height, this.settings.minBlockHeight);
    
    block.setSize(width, height);
    this.emit('blockResized', block);
    return true;
  }

  /**
   * Get block by ID
   * @param {string} id - The block ID
   * @returns {Block|null} The block or null if not found
   */
  getBlock(id) {
    return this.blocks.get(id) || null;
  }

  /**
   * Update block content
   * @param {string} id - The block ID
   * @param {string} content - The new content
   * @returns {boolean} Success status
   */
  setBlockContent(id, content) {
    const block = this.getBlock(id);
    if (!block) return false;
    
    block.setContent(content);
    this.emit('blockUpdated', block);
    return true;
  }

  /**
   * Link two blocks together
   * @param {string} fromId - Source block ID
   * @param {string} toId - Target block ID
   * @param {string} linkType - Type of link: 'single', 'reverse', or 'double'
   * @returns {boolean} Success status
   */
  linkBlocks(fromId, toId, linkType = 'single') {
    const fromBlock = this.getBlock(fromId);
    const toBlock = this.getBlock(toId);
    
    if (!fromBlock || !toBlock) return false;
    
    // Remove existing links between these blocks
    fromBlock.removeLink(toId);
    toBlock.removeLink(fromId);
    
    // Add links based on type
    if (linkType === 'single') {
      fromBlock.addLink(toId, 'single');
    } else if (linkType === 'reverse') {
      toBlock.addLink(fromId, 'single');
    } else if (linkType === 'double') {
      fromBlock.addLink(toId, 'double');
      toBlock.addLink(fromId, 'double');
    }
    
    this.emit('blocksLinked', { from: fromBlock, to: toBlock, linkType });
    return true;
  }

  /**
   * Update link type between blocks
   * @param {string} fromId - Source block ID
   * @param {string} toId - Target block ID
   * @param {string} newLinkType - New link type
   * @returns {boolean} Success status
   */
  updateLinkType(fromId, toId, newLinkType) {
    return this.linkBlocks(fromId, toId, newLinkType);
  }

  /**
   * Get link info between two blocks
   * @param {string} fromId - Source block ID
   * @param {string} toId - Target block ID
   * @returns {object|null} Link info or null
   */
  getLinkInfo(fromId, toId) {
    const fromBlock = this.getBlock(fromId);
    const toBlock = this.getBlock(toId);
    
    if (!fromBlock || !toBlock) return null;
    
    const hasForward = fromBlock.hasLink(toId);
    const hasReverse = toBlock.hasLink(fromId);
    
    if (hasForward && hasReverse) {
      return { type: 'double', from: fromId, to: toId };
    } else if (hasForward) {
      return { type: 'single', from: fromId, to: toId };
    } else if (hasReverse) {
      return { type: 'reverse', from: toId, to: fromId };
    }
    
    return null;
  }

  /**
   * Unlink two blocks
   * @param {string} fromId - Source block ID
   * @param {string} toId - Target block ID
   * @returns {boolean} Success status
   */
  unlinkBlocks(fromId, toId) {
    const fromBlock = this.getBlock(fromId);
    const toBlock = this.getBlock(toId);
    
    if (!fromBlock && !toBlock) return false;
    
    if (fromBlock) fromBlock.removeLink(toId);
    if (toBlock) toBlock.removeLink(fromId);
    
    this.emit('blocksUnlinked', { fromId, toId });
    return true;
  }

  /**
   * Delete a block
   * @param {string} id - The block ID to delete
   * @returns {boolean} Success status
   */
  deleteBlock(id) {
    const block = this.getBlock(id);
    if (!block) return false;
    
    // Remove all links to this block
    this.blocks.forEach(b => {
      if (b.hasLink(id)) {
        b.removeLink(id);
      }
    });
    
    this.blocks.delete(id);
    this.emit('blockDeleted', { id });
    return true;
  }

  /**
   * Get all blocks
   * @returns {Array} Array of all blocks
   */
  getAllBlocks() {
    return Array.from(this.blocks.values());
  }

  /**
   * Get blocks that link to a specific block
   * @param {string} id - The target block ID
   * @returns {Array} Array of blocks that link to the target
   */
  getIncomingLinks(id) {
    return this.getAllBlocks().filter(block => block.hasLink(id));
  }

  /**
   * Get blocks that a specific block links to
   * @param {string} id - The source block ID
   * @returns {Array} Array of blocks that the source links to
   */
  getOutgoingLinks(id) {
    const block = this.getBlock(id);
    if (!block) return [];
    
    return Array.from(block.links.keys())
      .map(linkId => this.getBlock(linkId))
      .filter(b => b !== null);
  }

  /**
   * Search blocks by content
   * @param {string} query - Search query
   * @returns {Array} Array of matching blocks
   */
  searchBlocks(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllBlocks().filter(block => 
      block.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Arrange blocks in a grid layout
   */
  arrangeBlocks(columns = 3) {
    const blocks = this.getAllBlocks();
    const spacing = this.settings.defaultSpacing;
    const startX = 50;
    const startY = 50;
    
    blocks.forEach((block, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const x = startX + (col * spacing);
      const y = startY + (row * spacing);
      
      this.setBlockPosition(block.id, x, y);
    });
    
    this.emit('blocksArranged', { count: blocks.length });
  }

  /**
   * Export all blocks as JSON
   * @returns {string} JSON string of all blocks
   */
  exportToJSON() {
    const data = {
      blocks: this.getAllBlocks().map(block => block.toJSON()),
      settings: this.settings,
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import blocks from JSON
   * @param {string} jsonData - JSON string of blocks
   * @returns {boolean} Success status
   */
  importFromJSON(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      // Clear existing blocks
      this.blocks.clear();
      
      // Import settings if available
      if (data.settings) {
        Object.assign(this.settings, data.settings);
      }
      
      // Import blocks
      data.blocks.forEach(blockData => {
        const block = new Block(blockData.id, blockData.content, blockData.type);
        
        // Convert old format to new format
        if (Array.isArray(blockData.links)) {
          // Handle both old format (array of IDs) and new format (array of objects)
          blockData.links.forEach(link => {
            if (typeof link === 'string') {
              block.links.set(link, { type: 'single', createdAt: new Date().toISOString() });
            } else {
              block.links.set(link.id, { type: link.type || 'single', createdAt: link.createdAt });
            }
          });
        }
        
        block.position = blockData.position || { x: 0, y: 0 };
        block.size = blockData.size || { width: 250, height: 150 };
        block.metadata = blockData.metadata;
        this.blocks.set(block.id, block);
      });
      
      this.emit('blocksImported', { count: data.blocks.length });
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique ID for blocks
   * @returns {string} Unique ID
   */
  generateId() {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event).forEach(callback => {
      callback(data);
    });
  }
}

// Export for use in browsers and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlockEngine, Block };
}