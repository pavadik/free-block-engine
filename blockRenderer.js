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

class BlockRenderer {
  constructor(engine, containerId) {
    this.engine = engine;
    this.container = document.getElementById(containerId);
    this.selectedBlocks = new Set();
    this.dragState = null;
    this.resizeState = null;
    this.viewMode = 'free'; // 'free' or 'grid'
    this.linkEditor = null;
    
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    
    this.setupEventListeners();
    this.setupStyles();
    this.setupContainerEvents();
  }

  /**
   * Setup CSS styles for blocks
   */
  setupStyles() {
    if (document.getElementById('block-renderer-styles')) return;
    
    const styles = `
      .blocks-container {
        position: relative;
        width: 100%;
        height: calc(100vh - 60px);
        overflow: auto;
        background: #f5f5f5;
        background-image: 
          linear-gradient(rgba(200,200,200,0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,200,200,0.2) 1px, transparent 1px);
        background-size: 20px 20px;
      }
      
      .blocks-container.grid-mode {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        padding: 20px;
        height: auto;
        background-image: none;
      }
      
      .block {
        background: #ffffff;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 15px;
        position: absolute;
        transition: box-shadow 0.3s ease, border-color 0.3s ease;
        cursor: move;
        min-width: 150px;
        min-height: 100px;
        user-select: none;
        overflow: hidden;
      }
      
      .grid-mode .block {
        position: relative !important;
        width: auto !important;
        height: auto !important;
      }
      
      .block:hover {
        border-color: #007bff;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 10;
      }
      
      .block.selected {
        border-color: #007bff;
        background: #f0f8ff;
        box-shadow: 0 4px 12px rgba(0,123,255,0.2);
      }
      
      .block.dragging {
        opacity: 0.8;
        z-index: 1000;
        cursor: grabbing;
      }
      
      .block.resizing {
        z-index: 999;
      }
      
      .block-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        cursor: move;
      }
      
      .block-id {
        font-size: 12px;
        color: #666;
        font-family: monospace;
      }
      
      .block-type {
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 11px;
        background: #e0e0e0;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        color: #666;
      }
      
      .block-content {
        margin: 10px 0;
        min-height: 50px;
        white-space: pre-wrap;
        word-wrap: break-word;
        cursor: text;
        padding-bottom: 20px; /* Space for type badge */
        overflow-y: auto;
        max-height: calc(100% - 100px);
      }
      
      .block-content[contenteditable="true"] {
        outline: none;
        padding: 5px;
        padding-bottom: 25px;
        background: #f9f9f9;
        border-radius: 4px;
      }
      
      .block-links {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e0e0e0;
      }
      
      .block-link {
        display: inline-flex;
        align-items: center;
        font-size: 12px;
        background: #007bff;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        margin-right: 5px;
        margin-bottom: 5px;
        text-decoration: none;
        cursor: pointer;
        position: relative;
      }
      
      .block-link:hover {
        background: #0056b3;
      }
      
      .block-link-type {
        margin-right: 5px;
        font-weight: bold;
      }
      
      .block-actions {
        position: absolute;
        top: 10px;
        right: 10px;
        display: none;
      }
      
      .block:hover .block-actions {
        display: flex;
        gap: 5px;
      }
      
      .block-action {
        background: #f0f0f0;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .block-action:hover {
        background: #e0e0e0;
      }
      
      .block-action.delete {
        color: #dc3545;
      }
      
      .block-action.links {
        color: #007bff;
      }
      
      .block-metadata {
        font-size: 10px;
        color: #999;
        margin-top: 10px;
      }
      
      /* Resize handles */
      .resize-handle {
        position: absolute;
        background: #007bff;
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .block:hover .resize-handle {
        opacity: 0.3;
      }
      
      .resize-handle:hover,
      .resize-handle.active {
        opacity: 1 !important;
      }
      
      .resize-handle-right {
        right: 0;
        top: 20%;
        bottom: 20%;
        width: 5px;
        cursor: ew-resize;
      }
      
      .resize-handle-bottom {
        bottom: 0;
        left: 20%;
        right: 20%;
        height: 5px;
        cursor: ns-resize;
      }
      
      .resize-handle-corner {
        width: 10px;
        height: 10px;
        right: 0;
        bottom: 0;
        cursor: nwse-resize;
        background: #007bff;
        border-radius: 0 0 6px 0;
      }
      
      .link-line {
        position: absolute;
        pointer-events: none;
        z-index: 1;
      }
      
      .link-line svg {
        position: absolute;
        top: 0;
        left: 0;
        overflow: visible;
      }
      
      .link-line path {
        fill: none;
        stroke: #007bff;
        stroke-width: 2;
        opacity: 0.6;
      }
      
      .link-line path:hover {
        stroke-width: 3;
        opacity: 1;
      }
      
      .link-endpoint {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #dc3545;
        border: 2px solid #fff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        z-index: 5;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .link-editor-popup {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        min-width: 250px;
      }
      
      .link-editor-popup h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #333;
      }
      
      .link-editor-list {
        max-height: 300px;
        overflow-y: auto;
      }
      
      .link-editor-item {
        padding: 8px;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        margin-bottom: 8px;
        background: #f9f9f9;
      }
      
      .link-editor-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      
      .link-editor-item-title {
        font-weight: bold;
        font-size: 14px;
        color: #333;
      }
      
      .link-editor-item-content {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .link-editor-item-actions {
        display: flex;
        gap: 5px;
      }
      
      .link-editor-item-actions button {
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      
      .link-editor-item-actions button:hover {
        background: #f0f0f0;
        border-color: #007bff;
      }
      
      .link-editor-item-actions button.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      
      .link-editor-item-actions button.delete {
        color: #dc3545;
        border-color: #dc3545;
      }
      
      .link-editor-item-actions button.delete:hover {
        background: #dc3545;
        color: white;
      }
      
      .link-editor-add {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #e0e0e0;
      }
      
      .link-editor-add-button {
        width: 100%;
        padding: 8px;
        border: 2px dashed #007bff;
        border-radius: 4px;
        background: #f0f8ff;
        color: #007bff;
        cursor: pointer;
        font-size: 14px;
        text-align: center;
      }
      
      .link-editor-add-button:hover {
        background: #e6f2ff;
        border-style: solid;
      }
      
      .link-editor-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        width: 24px;
        height: 24px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .link-editor-close:hover {
        color: #333;
      }
      
      .minimap {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 200px;
        height: 150px;
        background: rgba(255,255,255,0.9);
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        z-index: 100;
      }
      
      .minimap-viewport {
        position: absolute;
        border: 2px solid #007bff;
        background: rgba(0,123,255,0.1);
        pointer-events: none;
      }
      
      .minimap-block {
        position: absolute;
        background: #666;
        border-radius: 2px;
      }
      
      .minimap-block.selected {
        background: #007bff;
      }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'block-renderer-styles';
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  /**
   * Setup event listeners for engine events
   */
  setupEventListeners() {
    this.engine.on('blockCreated', () => this.render());
    this.engine.on('blockUpdated', () => this.render());
    this.engine.on('blockDeleted', () => this.render());
    this.engine.on('blocksLinked', () => this.render());
    this.engine.on('blocksUnlinked', () => this.render());
    this.engine.on('blocksImported', () => this.render());
    this.engine.on('blockMoved', () => this.updateConnections());
    this.engine.on('blockResized', () => this.updateConnections());
    this.engine.on('blocksArranged', () => this.render());
  }

  /**
   * Setup container events
   */
  setupContainerEvents() {
    // Prevent text selection during drag
    this.container.addEventListener('selectstart', (e) => {
      if (this.dragState || this.resizeState) {
        e.preventDefault();
      }
    });
    
    // Close link editor when clicking outside
    document.addEventListener('click', (e) => {
      if (this.linkEditor && !this.linkEditor.contains(e.target) && 
          !e.target.closest('.block-action.links') &&
          !e.target.closest('.block-link-edit')) {
        this.closeLinkEditor();
      }
    });
  }

  /**
   * Create HTML element for a block
   */
  createBlockElement(block) {
    const div = document.createElement('div');
    div.className = 'block';
    div.dataset.blockId = block.id;
    
    if (this.selectedBlocks.has(block.id)) {
      div.classList.add('selected');
    }
    
    // Set position and size for free mode
    if (this.viewMode === 'free') {
      div.style.left = block.position.x + 'px';
      div.style.top = block.position.y + 'px';
      div.style.width = block.size.width + 'px';
      div.style.height = block.size.height + 'px';
    }
    
    // Header
    const header = document.createElement('div');
    header.className = 'block-header';
    
    const idSpan = document.createElement('span');
    idSpan.className = 'block-id';
    idSpan.textContent = block.id.substring(0, 12) + '...';
    idSpan.title = block.id;
    
    header.appendChild(idSpan);
    
    // Content
    const content = document.createElement('div');
    content.className = 'block-content';
    content.textContent = block.content || '(empty)';
    content.contentEditable = true;
    
    // Type badge (moved to bottom right)
    const typeSpan = document.createElement('span');
    typeSpan.className = 'block-type';
    typeSpan.textContent = block.type;
    
    // Links
    const linksDiv = document.createElement('div');
    linksDiv.className = 'block-links';
    
    // Show both outgoing and incoming links
    const outgoingLinks = Array.from(block.links.entries());
    const incomingLinks = this.engine.getIncomingLinks(block.id)
      .filter(b => !block.hasLink(b.id)) // Don't show if it's already in outgoing
      .map(b => [b.id, { type: 'incoming' }]);
    
    const allLinks = [...outgoingLinks, ...incomingLinks];
    
    if (allLinks.length > 0) {
      const linksLabel = document.createElement('div');
      linksLabel.style.fontSize = '12px';
      linksLabel.style.color = '#666';
      linksLabel.style.marginBottom = '5px';
      linksLabel.textContent = 'Connections:';
      linksDiv.appendChild(linksLabel);
      
      allLinks.forEach(([linkId, linkMeta]) => {
        const linkedBlock = this.engine.getBlock(linkId);
        if (linkedBlock) {
          const link = document.createElement('span');
          link.className = 'block-link';
          
          // Show link type icon
          const typeSpan = document.createElement('span');
          typeSpan.className = 'block-link-type';
          
          if (linkMeta.type === 'incoming') {
            typeSpan.textContent = '←';
          } else if (linkMeta.type === 'double') {
            typeSpan.textContent = '↔';
          } else {
            typeSpan.textContent = '→';
          }
          
          link.appendChild(typeSpan);
          
          const textSpan = document.createElement('span');
          textSpan.textContent = linkId.substring(0, 8) + '...';
          textSpan.title = linkedBlock.content || linkId;
          link.appendChild(textSpan);
          
          link.onclick = (e) => {
            e.stopPropagation();
            this.scrollToBlock(linkId);
          };
          
          linksDiv.appendChild(link);
        }
      });
    }
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'block-actions';
    
    const linksBtn = document.createElement('button');
    linksBtn.className = 'block-action links';
    linksBtn.textContent = '🔗';
    linksBtn.title = 'Manage links';
    linksBtn.onclick = (e) => {
      e.stopPropagation();
      this.openLinkEditor(block.id, div);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'block-action delete';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete block';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteBlock(block.id);
    };
    
    actions.appendChild(linksBtn);
    actions.appendChild(deleteBtn);
    
    // Metadata
    const metadata = document.createElement('div');
    metadata.className = 'block-metadata';
    metadata.textContent = `Created: ${new Date(block.metadata.createdAt).toLocaleString()}`;
    
    // Resize handles (only in free mode)
    if (this.viewMode === 'free') {
      // Right resize handle
      const resizeRight = document.createElement('div');
      resizeRight.className = 'resize-handle resize-handle-right';
      this.setupResizeEvents(resizeRight, block, 'right');
      
      // Bottom resize handle
      const resizeBottom = document.createElement('div');
      resizeBottom.className = 'resize-handle resize-handle-bottom';
      this.setupResizeEvents(resizeBottom, block, 'bottom');
      
      // Corner resize handle
      const resizeCorner = document.createElement('div');
      resizeCorner.className = 'resize-handle resize-handle-corner';
      this.setupResizeEvents(resizeCorner, block, 'corner');
      
      div.appendChild(resizeRight);
      div.appendChild(resizeBottom);
      div.appendChild(resizeCorner);
    }
    
    // Assemble
    div.appendChild(header);
    div.appendChild(actions);
    div.appendChild(content);
    if (allLinks.length > 0) {
      div.appendChild(linksDiv);
    }
    div.appendChild(metadata);
    div.appendChild(typeSpan); // Type badge at the end
    
    // Event listeners
    if (this.viewMode === 'free') {
      this.setupDragEvents(div, block);
    }
    
    div.onclick = (e) => {
      if (e.target === content || e.target.classList.contains('block-link')) return;
      this.selectBlock(block.id, e.ctrlKey || e.metaKey);
    };
    
    content.onblur = () => {
      this.engine.setBlockContent(block.id, content.textContent);
    };
    
    content.onkeydown = (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        content.blur();
      }
    };
    
    // Prevent drag when editing content
    content.onmousedown = (e) => e.stopPropagation();
    
    return div;
  }

  /**
   * Setup resize events for a handle
   */
  setupResizeEvents(handle, block, type) {
    let isResizing = false;
    
    const handleMouseDown = (e) => {
      isResizing = true;
      handle.classList.add('active');
      
      const blockEl = handle.parentElement;
      blockEl.classList.add('resizing');
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = blockEl.offsetWidth;
      const startHeight = blockEl.offsetHeight;
      
      this.resizeState = {
        blockId: block.id,
        type: type,
        startX: startX,
        startY: startY,
        startWidth: startWidth,
        startHeight: startHeight
      };
      
      e.preventDefault();
      e.stopPropagation();
    };
    
    const handleMouseMove = (e) => {
      if (!isResizing || !this.resizeState) return;
      
      const blockEl = document.querySelector(`[data-block-id="${this.resizeState.blockId}"]`);
      if (!blockEl) return;
      
      const deltaX = e.clientX - this.resizeState.startX;
      const deltaY = e.clientY - this.resizeState.startY;
      
      let newWidth = this.resizeState.startWidth;
      let newHeight = this.resizeState.startHeight;
      
      if (this.resizeState.type === 'right' || this.resizeState.type === 'corner') {
        newWidth = Math.max(150, this.resizeState.startWidth + deltaX);
      }
      
      if (this.resizeState.type === 'bottom' || this.resizeState.type === 'corner') {
        newHeight = Math.max(100, this.resizeState.startHeight + deltaY);
      }
      
      blockEl.style.width = newWidth + 'px';
      blockEl.style.height = newHeight + 'px';
      
      // Update connections while resizing
      this.updateConnectionsForBlock(this.resizeState.blockId);
    };
    
    const handleMouseUp = (e) => {
      if (!isResizing || !this.resizeState) return;
      
      isResizing = false;
      handle.classList.remove('active');
      
      const blockEl = document.querySelector(`[data-block-id="${this.resizeState.blockId}"]`);
      if (blockEl) {
        blockEl.classList.remove('resizing');
        
        // Save new size
        const newWidth = blockEl.offsetWidth;
        const newHeight = blockEl.offsetHeight;
        this.engine.setBlockSize(this.resizeState.blockId, newWidth, newHeight);
      }
      
      this.resizeState = null;
      this.updateMinimap();
    };
    
    // Mouse events
    handle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    handle.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      });
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isResizing) return;
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
    
    document.addEventListener('touchend', (e) => {
      if (!isResizing) return;
      const touch = e.changedTouches[0];
      handleMouseUp({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
  }

  /**
   * Setup drag events for a block
   */
  setupDragEvents(element, block) {
    let isDragging = false;
    
    const handleMouseDown = (e) => {
      // Don't start drag if clicking on content, actions, or resize handles
      if (e.target.classList.contains('block-content') || 
          e.target.closest('.block-actions') ||
          e.target.classList.contains('resize-handle')) {
        return;
      }
      
      isDragging = true;
      element.classList.add('dragging');
      
      const rect = element.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      this.dragState = {
        blockId: block.id,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        startX: rect.left - containerRect.left + this.container.scrollLeft,
        startY: rect.top - containerRect.top + this.container.scrollTop
      };
      
      e.preventDefault();
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging || !this.dragState) return;
      
      const containerRect = this.container.getBoundingClientRect();
      const x = e.clientX - containerRect.left + this.container.scrollLeft - this.dragState.offsetX;
      const y = e.clientY - containerRect.top + this.container.scrollTop - this.dragState.offsetY;
      
      element.style.left = x + 'px';
      element.style.top = y + 'px';
      
      // Update connections while dragging
      this.updateConnectionsForBlock(block.id);
    };
    
    const handleMouseUp = (e) => {
      if (!isDragging || !this.dragState) return;
      
      isDragging = false;
      element.classList.remove('dragging');
      
      const containerRect = this.container.getBoundingClientRect();
      const x = e.clientX - containerRect.left + this.container.scrollLeft - this.dragState.offsetX;
      const y = e.clientY - containerRect.top + this.container.scrollTop - this.dragState.offsetY;
      
      // Save position
      this.engine.setBlockPosition(block.id, x, y);
      
      this.dragState = null;
      this.updateMinimap();
    };
    
    // Mouse events
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    element.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      handleMouseDown({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => e.preventDefault()
      });
    });
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
    
    document.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      const touch = e.changedTouches[0];
      handleMouseUp({
        clientX: touch.clientX,
        clientY: touch.clientY
      });
    });
  }

  /**
   * Set view mode
   */
  setViewMode(mode) {
    this.viewMode = mode;
    if (mode === 'grid') {
      this.container.classList.add('grid-mode');
    } else {
      this.container.classList.remove('grid-mode');
    }
    this.render();
  }

  /**
   * Render all blocks to the container
   */
  render() {
    // Save link editor state if open
    const linkEditorBlockId = this.linkEditor?.dataset?.blockId;
    
    this.container.innerHTML = '';
    this.container.className = 'blocks-container';
    
    if (this.viewMode === 'grid') {
      this.container.classList.add('grid-mode');
    }
    
    const blocks = this.engine.getAllBlocks();
    
    // Create SVG for connections
    if (this.viewMode === 'free') {
      this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgContainer.style.position = 'absolute';
      this.svgContainer.style.top = '0';
      this.svgContainer.style.left = '0';
      this.svgContainer.style.width = '100%';
      this.svgContainer.style.height = '100%';
      this.svgContainer.style.pointerEvents = 'none';
      
      this.container.appendChild(this.svgContainer);
    }
    
    blocks.forEach(block => {
      const blockElement = this.createBlockElement(block);
      this.container.appendChild(blockElement);
    });
    
    // Draw connections after blocks are rendered
    if (this.viewMode === 'free') {
      setTimeout(() => {
        this.drawConnections();
        this.createMinimap();
        
        // Restore link editor if it was open
        if (linkEditorBlockId) {
          const blockEl = document.querySelector(`[data-block-id="${linkEditorBlockId}"]`);
          if (blockEl) {
            this.openLinkEditor(linkEditorBlockId, blockEl);
          }
        }
      }, 0);
    }
  }
  
  /**
   * Get the best connection point on a block
   */
	getConnectionPoint(sourceEl, targetEl) {
		const sourceRect = sourceEl.getBoundingClientRect();
		const targetRect = targetEl.getBoundingClientRect();
		const containerRect = this.container.getBoundingClientRect();
	
		const sourceCenterX = sourceRect.left + sourceRect.width / 2;
		const sourceCenterY = sourceRect.top + sourceRect.height / 2;
		const targetCenterX = targetRect.left + targetRect.width / 2;
		const targetCenterY = targetRect.top + targetRect.height / 2;

		const dx = targetCenterX - sourceCenterX;
		const dy = targetCenterY - sourceCenterY;

		const widthRatio = Math.abs(dx) / sourceRect.width;
		const heightRatio = Math.abs(dy) / sourceRect.height;
		
		let intersectionX, intersectionY;

		if (widthRatio > heightRatio) {
			const sign = Math.sign(dx);
			intersectionX = sourceCenterX + sign * (sourceRect.width / 2);
			intersectionY = sourceCenterY + dy * (sign * (sourceRect.width / 2) / dx);
		} 
		else {
			const sign = Math.sign(dy);
			intersectionY = sourceCenterY + sign * (sourceRect.height / 2);
			intersectionX = sourceCenterX + dx * (sign * (sourceRect.height / 2) / dy);
		}

		return {
			x: intersectionX - containerRect.left + this.container.scrollLeft,
			y: intersectionY - containerRect.top + this.container.scrollTop,
		};
	}
    
  /**
   * Draw connections between linked blocks
   */
  drawConnections() {
    if (!this.svgContainer) return;
    
    // Clear existing paths and endpoints
    this.svgContainer.innerHTML = '';
    document.querySelectorAll('.link-endpoint').forEach(el => el.remove());
    
    // Track drawn connections to avoid duplicates
    const drawnConnections = new Set();
    
    this.engine.getAllBlocks().forEach(block => {
      block.links.forEach((linkMeta, targetId) => {
        const sourceEl = document.querySelector(`[data-block-id="${block.id}"]`);
        const targetEl = document.querySelector(`[data-block-id="${targetId}"]`);
        
        if (sourceEl && targetEl) {
          // Create unique key for this connection
          const key1 = `${block.id}-${targetId}`;
          const key2 = `${targetId}-${block.id}`;
          
          // Check if this is a double link or if we've already drawn this connection
          const targetBlock = this.engine.getBlock(targetId);
          const isDouble = targetBlock && targetBlock.hasLink(block.id);
          
          if (!drawnConnections.has(key1) && !drawnConnections.has(key2)) {
            this.drawSmartCurvedLine(block.id, targetId, linkMeta.type);
            drawnConnections.add(key1);
            if (isDouble) {
              drawnConnections.add(key2);
            }
          }
        }
      });
    });
  }

  /**
   * Update connections for a specific block
   */
  updateConnectionsForBlock(blockId) {
    if (!this.svgContainer) return;
    
    // Remove existing connections and endpoints for this block
    this.svgContainer.querySelectorAll(`[data-from="${blockId}"],[data-to="${blockId}"]`).forEach(path => {
      path.remove();
    });
    document.querySelectorAll(`.link-endpoint[data-from="${blockId}"],.link-endpoint[data-to="${blockId}"]`).forEach(el => {
      el.remove();
    });
    
    // Redraw connections
    const block = this.engine.getBlock(blockId);
    if (block) {
      // Outgoing connections
      block.links.forEach((linkMeta, targetId) => {
        this.drawSmartCurvedLine(blockId, targetId, linkMeta.type);
      });
      
      // Incoming connections
      this.engine.getIncomingLinks(blockId).forEach(sourceBlock => {
        const linkType = sourceBlock.getLinkType(blockId);
        if (linkType && !block.hasLink(sourceBlock.id)) {
          this.drawSmartCurvedLine(sourceBlock.id, blockId, linkType);
        }
      });
    }
  }

  /**
   * Draw a smart curved line between two blocks with red circle endpoints
   */
  drawSmartCurvedLine(sourceId, targetId, linkType = 'single') {
    const sourceEl = document.querySelector(`[data-block-id="${sourceId}"]`);
    const targetEl = document.querySelector(`[data-block-id="${targetId}"]`);
    
    if (!sourceEl || !targetEl || !this.svgContainer) return;
    
    // Get optimal connection points
    const sourcePoint = this.getConnectionPoint(sourceEl, targetEl);
    const targetPoint = this.getConnectionPoint(targetEl, sourceEl);
    
    const x1 = sourcePoint.x;
    const y1 = sourcePoint.y;
    const x2 = targetPoint.x;
    const y2 = targetPoint.y;
    
    // Calculate control points for the curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust control points based on the connection direction
    let cp1x, cp1y, cp2x, cp2y;
    
    // Determine if blocks are more horizontally or vertically aligned
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    
    if (isHorizontal) {
      // Horizontal connection
      const offset = Math.min(distance / 3, 100);
      cp1x = x1 + Math.sign(dx) * offset;
      cp1y = y1;
      cp2x = x2 - Math.sign(dx) * offset;
      cp2y = y2;
    } else {
      // Vertical connection
      const offset = Math.min(distance / 3, 100);
      cp1x = x1;
      cp1y = y1 + Math.sign(dy) * offset;
      cp2x = x2;
      cp2y = y2 - Math.sign(dy) * offset;
    }
    
    // Create curved path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`);
    path.setAttribute('data-from', sourceId);
    path.setAttribute('data-to', targetId);
    path.setAttribute('data-link-type', linkType);
    
    this.svgContainer.appendChild(path);
    
    // Create red circle endpoints
    const createEndpoint = (x, y, type, fromId, toId) => {
      const endpoint = document.createElement('div');
      endpoint.className = `link-endpoint ${type}`;
      endpoint.style.left = x + 'px';
      endpoint.style.top = y + 'px';
      endpoint.setAttribute('data-from', fromId);
      endpoint.setAttribute('data-to', toId);
      this.container.appendChild(endpoint);
    };
    
    // Add source endpoint (for outgoing connections or bidirectional)
    if (linkType === 'single' || linkType === 'double') {
      createEndpoint(x1, y1, 'source', sourceId, targetId);
    }
    
    // Add target endpoint
    createEndpoint(x2, y2, 'target', sourceId, targetId);
    
    // For bidirectional, add reverse source endpoint
    if (linkType === 'double') {
      createEndpoint(x1, y1, 'target', targetId, sourceId);
    }
  }

  /**
   * Update all connections
   */
  updateConnections() {
    if (this.viewMode === 'free') {
      this.drawConnections();
      this.updateMinimap();
    }
  }

  /**
   * Create minimap
   */
  createMinimap() {
    // Remove existing minimap
    const existingMinimap = document.querySelector('.minimap');
    if (existingMinimap) {
      existingMinimap.remove();
    }
    
    const minimap = document.createElement('div');
    minimap.className = 'minimap';
    
    const blocks = this.engine.getAllBlocks();
    if (blocks.length === 0) return;
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    blocks.forEach(block => {
      minX = Math.min(minX, block.position.x);
      minY = Math.min(minY, block.position.y);
      maxX = Math.max(maxX, block.position.x + block.size.width);
      maxY = Math.max(maxY, block.position.y + block.size.height);
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.min(200 / width, 150 / height);
    
    // Create minimap blocks
    blocks.forEach(block => {
      const minimapBlock = document.createElement('div');
      minimapBlock.className = 'minimap-block';
      if (this.selectedBlocks.has(block.id)) {
        minimapBlock.classList.add('selected');
      }
      
      const x = (block.position.x - minX) * scale;
      const y = (block.position.y - minY) * scale;
      
      minimapBlock.style.left = x + 'px';
      minimapBlock.style.top = y + 'px';
      minimapBlock.style.width = (block.size.width * scale) + 'px';
      minimapBlock.style.height = (block.size.height * scale) + 'px';
      
      minimap.appendChild(minimapBlock);
    });
    
    // Create viewport indicator
    const viewport = document.createElement('div');
    viewport.className = 'minimap-viewport';
    
    const updateViewport = () => {
      const viewWidth = this.container.clientWidth;
      const viewHeight = this.container.clientHeight;
      const scrollLeft = this.container.scrollLeft;
      const scrollTop = this.container.scrollTop;
      
      viewport.style.left = ((scrollLeft - minX) * scale) + 'px';
      viewport.style.top = ((scrollTop - minY) * scale) + 'px';
      viewport.style.width = (viewWidth * scale) + 'px';
      viewport.style.height = (viewHeight * scale) + 'px';
    };
    
    updateViewport();
    this.container.addEventListener('scroll', updateViewport);
    
    minimap.appendChild(viewport);
    document.body.appendChild(minimap);
  }

  /**
   * Update minimap
   */
  updateMinimap() {
    if (this.viewMode === 'free') {
      this.createMinimap();
    }
  }

  // ... остальные методы остаются без изменений ...

  /**
   * Open link editor for a block
   */
  openLinkEditor(blockId, blockElement) {
    this.closeLinkEditor();
    
    const block = this.engine.getBlock(blockId);
    if (!block) return;
    
    // Create editor
    const editor = document.createElement('div');
    editor.className = 'link-editor-popup';
    editor.dataset.blockId = blockId;
    
    // Position editor next to block
    const rect = blockElement.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    
    editor.style.left = (rect.right - containerRect.left + this.container.scrollLeft + 10) + 'px';
    editor.style.top = (rect.top - containerRect.top + this.container.scrollTop) + 'px';
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Manage Links';
    editor.appendChild(title);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'link-editor-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.closeLinkEditor();
    editor.appendChild(closeBtn);
    
    // Links list
    const linksList = document.createElement('div');
    linksList.className = 'link-editor-list';
    
    // Show outgoing links
    block.links.forEach((linkMeta, targetId) => {
      const targetBlock = this.engine.getBlock(targetId);
      if (targetBlock) {
        const item = this.createLinkEditorItem(block, targetBlock, linkMeta.type, 'outgoing');
        linksList.appendChild(item);
      }
    });
    
    // Show incoming links (that aren't already bidirectional)
    this.engine.getIncomingLinks(blockId).forEach(sourceBlock => {
      if (!block.hasLink(sourceBlock.id)) {
        const item = this.createLinkEditorItem(sourceBlock, block, 'single', 'incoming');
        linksList.appendChild(item);
      }
    });
    
    editor.appendChild(linksList);
    
    // Add new link button
    const addSection = document.createElement('div');
    addSection.className = 'link-editor-add';
        const addButton = document.createElement('button');
    addButton.className = 'link-editor-add-button';
    addButton.textContent = '+ Add New Link';
    addButton.onclick = () => {
      this.closeLinkEditor();
      this.startLinkingMode(blockId);
    };
    
    addSection.appendChild(addButton);
    editor.appendChild(addSection);
    
    // Add to container
    this.container.appendChild(editor);
    this.linkEditor = editor;
    
    // Adjust position if editor goes outside viewport
    setTimeout(() => {
      const editorRect = editor.getBoundingClientRect();
      if (editorRect.right > window.innerWidth) {
        editor.style.left = (rect.left - containerRect.left + this.container.scrollLeft - editor.offsetWidth - 10) + 'px';
      }
      if (editorRect.bottom > window.innerHeight) {
        editor.style.top = (Math.max(0, window.innerHeight - editorRect.height - 20) - containerRect.top + this.container.scrollTop) + 'px';
      }
    }, 0);
  }

  /**
   * Create a link editor item
   */
  createLinkEditorItem(fromBlock, toBlock, currentType, direction) {
    const item = document.createElement('div');
    item.className = 'link-editor-item';
    
    // Header
    const header = document.createElement('div');
    header.className = 'link-editor-item-header';
    
    const title = document.createElement('div');
    title.className = 'link-editor-item-title';
    
    if (direction === 'outgoing') {
      title.textContent = `→ ${toBlock.id.substring(0, 12)}...`;
    } else {
      title.textContent = `← ${fromBlock.id.substring(0, 12)}...`;
    }
    
    header.appendChild(title);
    
    // Content preview
    const content = document.createElement('div');
    content.className = 'link-editor-item-content';
    content.textContent = (direction === 'outgoing' ? toBlock.content : fromBlock.content) || '(empty)';
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'link-editor-item-actions';
    
    if (direction === 'outgoing') {
      // Single direction button
      const singleBtn = document.createElement('button');
      singleBtn.textContent = '→';
      singleBtn.title = 'Single direction';
      singleBtn.classList.toggle('active', currentType === 'single');
      singleBtn.onclick = () => {
        this.engine.updateLinkType(fromBlock.id, toBlock.id, 'single');
        this.closeLinkEditor();
      };
      actions.appendChild(singleBtn);
      
      // Reverse direction button
      const reverseBtn = document.createElement('button');
      reverseBtn.textContent = '←';
      reverseBtn.title = 'Reverse direction';
      reverseBtn.onclick = () => {
        this.engine.updateLinkType(fromBlock.id, toBlock.id, 'reverse');
        this.closeLinkEditor();
      };
      actions.appendChild(reverseBtn);
      
      // Double direction button
      const doubleBtn = document.createElement('button');
      doubleBtn.textContent = '↔';
      doubleBtn.title = 'Bidirectional';
      doubleBtn.classList.toggle('active', currentType === 'double');
      doubleBtn.onclick = () => {
        this.engine.updateLinkType(fromBlock.id, toBlock.id, 'double');
        this.closeLinkEditor();
      };
      actions.appendChild(doubleBtn);
    } else {
      // For incoming links, show option to make bidirectional
      const doubleBtn = document.createElement('button');
      doubleBtn.textContent = '↔';
      doubleBtn.title = 'Make bidirectional';
      doubleBtn.onclick = () => {
        this.engine.updateLinkType(fromBlock.id, toBlock.id, 'double');
        this.closeLinkEditor();
      };
      actions.appendChild(doubleBtn);
    }
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = '🗑';
    deleteBtn.title = 'Delete link';
    deleteBtn.onclick = () => {
      this.engine.unlinkBlocks(fromBlock.id, toBlock.id);
      this.closeLinkEditor();
    };
    actions.appendChild(deleteBtn);
    
    // Assemble
    item.appendChild(header);
    item.appendChild(content);
    item.appendChild(actions);
    
    return item;
  }

  /**
   * Start linking mode
   */
  startLinkingMode(sourceBlockId) {
    const sourceEl = document.querySelector(`[data-block-id="${sourceBlockId}"]`);
    if (!sourceEl) return;
    
    // Highlight source block
    sourceEl.classList.add('linking-source');
    
    // Change cursor
    this.container.style.cursor = 'crosshair';
    
    // Create temporary line that follows mouse
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('stroke', '#007bff');
    tempLine.setAttribute('stroke-width', '2');
    tempLine.setAttribute('stroke-dasharray', '5,5');
    tempLine.style.pointerEvents = 'none';
    
    const sourceRect = sourceEl.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width / 2 - containerRect.left + this.container.scrollLeft;
    const startY = sourceRect.top + sourceRect.height / 2 - containerRect.top + this.container.scrollTop;
    
    tempLine.setAttribute('x1', startX);
    tempLine.setAttribute('y1', startY);
    tempLine.setAttribute('x2', startX);
    tempLine.setAttribute('y2', startY);
    
    this.svgContainer.appendChild(tempLine);
    
    const handleMouseMove = (e) => {
      const x = e.clientX - containerRect.left + this.container.scrollLeft;
      const y = e.clientY - containerRect.top + this.container.scrollTop;
      tempLine.setAttribute('x2', x);
      tempLine.setAttribute('y2', y);
    };
    
    const handleClick = (e) => {
      // Clean up
      tempLine.remove();
      sourceEl.classList.remove('linking-source');
      this.container.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      
      // Check if clicked on a block
      const targetEl = e.target.closest('.block');
      if (targetEl && targetEl.dataset.blockId !== sourceBlockId) {
        const linkType = document.getElementById('linkTypeSelect')?.value || 'single';
        this.engine.linkBlocks(sourceBlockId, targetEl.dataset.blockId, linkType);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
  }

  /**
   * Close link editor
   */
  closeLinkEditor() {
    if (this.linkEditor) {
      this.linkEditor.remove();
      this.linkEditor = null;
    }
  }

  /**
   * Select/deselect a block
   */
  selectBlock(id, multiSelect = false) {
    if (!multiSelect) {
      this.selectedBlocks.clear();
    }
    
    if (this.selectedBlocks.has(id)) {
      this.selectedBlocks.delete(id);
    } else {
      this.selectedBlocks.add(id);
    }
    
    // Update visual selection
    document.querySelectorAll('.block').forEach(el => {
      if (this.selectedBlocks.has(el.dataset.blockId)) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
    
    this.updateMinimap();
  }

  /**
   * Scroll to a specific block
   */
  scrollToBlock(id) {
    const blockEl = document.querySelector(`[data-block-id="${id}"]`);
    if (blockEl) {
      const rect = blockEl.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      this.container.scrollTo({
        left: this.container.scrollLeft + rect.left - containerRect.left - 100,
        top: this.container.scrollTop + rect.top - containerRect.top - 100,
        behavior: 'smooth'
      });
      
      blockEl.classList.add('selected');
      setTimeout(() => blockEl.classList.remove('selected'), 2000);
    }
  }

  /**
   * Delete a block
   */
  deleteBlock(id) {
    if (confirm('Are you sure you want to delete this block?')) {
      this.engine.deleteBlock(id);
    }
  }

  /**
   * Get selected blocks
   */
  getSelectedBlocks() {
    return Array.from(this.selectedBlocks).map(id => this.engine.getBlock(id));
  }

  /**
   * Link selected blocks with specified type
   */
  linkSelected(linkType = 'single') {
    const selected = Array.from(this.selectedBlocks);
    if (selected.length < 2) {
      alert('Select at least 2 blocks to link');
      return;
    }
    
    for (let i = 0; i < selected.length - 1; i++) {
      this.engine.linkBlocks(selected[i], selected[i + 1], linkType);
    }
    
    this.selectedBlocks.clear();
  }
}