# Free Block Engine 🔗

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/javascript-ES6+-yellow.svg" alt="JavaScript">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen.svg" alt="Dependencies">
</p>

<p align="center">
  <strong>A simple visual block management system for creating interactive, interconnected content</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API</a> •
  <a href="#examples">Examples</a> •
  <a href="#customization">Customization</a> •
  <a href="#license">License</a>
</p>

---

## ✨ Features

### 🎯 Core Functionality
- **Visual Block Management** - Create, edit, and organize content blocks with an intuitive interface
- **Drag & Drop Positioning** - Move blocks freely across the canvas with smooth animations
- **Dynamic Resizing** - Resize blocks with visual handles (right, bottom, corner)
- **Smart Connection System** - Create relationships between blocks with intelligent routing

### 🔄 Connection Types
- **→ Single Direction** - One-way connection from source to target
- **← Reverse Direction** - One-way connection from target to source
- **↔ Bidirectional** - Two-way connection between blocks

### 🎨 Visual Features
- **Grid Background** - 20px grid for precise alignment
- **Minimap Navigation** - Bird's-eye view with viewport indicator
- **Red Circle Endpoints** - Visual indicators at connection points
- **Hover Effects** - Interactive feedback for better UX
- **Type Badges** - Visual block categorization (Note, Task, Default)

### 💾 Data Management
- **Import/Export** - Full JSON serialization with position and size preservation
- **Search Functionality** - Real-time content search across all blocks
- **Auto-save Positions** - Automatic position and size persistence
- **Metadata Tracking** - Creation and modification timestamps

### 🛠️ Developer Features
- **Event System** - Subscribe to block creation, updates, and deletions
- **Zero Dependencies** - Pure JavaScript implementation
- **Extensible Architecture** - Easy to extend with custom block types
- **Mobile Support** - Touch events for mobile devices

## 🚀 Quick Start

### Installation

```html
<!-- Include the JavaScript files -->
<script src="blockEngine.js"></script>
<script src="blockRenderer.js"></script>
```

### Basic Usage

```javascript
// Initialize the engine
const engine = new BlockEngine();
const renderer = new BlockRenderer(engine, 'container-id');

// Create your first block
const block = engine.createBlock('Hello World!', 'note');

// Link blocks together
const block2 = engine.createBlock('Connected Block');
engine.linkBlocks(block.id, block2.id, 'single');
```

### HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
    <title>Block Engine Example</title>
</head>
<body>
    <div id="container-id"></div>
    
    <script src="blockEngine.js"></script>
    <script src="blockRenderer.js"></script>
    <script>
        // Your implementation
    </script>
</body>
</html>
```

## 📚 API Reference

### BlockEngine

#### Creating Blocks

```javascript
// Basic block creation
const block = engine.createBlock(content, type, position, size);

// Parameters:
// content: string - The block content
// type: string - Block type ('default', 'note', 'task')
// position: {x, y} - Optional position (auto-positioned if not provided)
// size: {width, height} - Optional size (default: 250x150)
```

#### Managing Positions and Sizes

```javascript
// Update block position (with grid snapping)
engine.setBlockPosition(blockId, x, y, snapToGrid = true);

// Update block size (respects minimum dimensions)
engine.setBlockSize(blockId, width, height);
```

#### Creating Connections

```javascript
// Create different types of connections
engine.linkBlocks(fromId, toId, 'single');   // One-way →
engine.linkBlocks(fromId, toId, 'reverse');  // One-way ←
engine.linkBlocks(fromId, toId, 'double');   // Two-way ↔

// Update existing connection
engine.updateLinkType(fromId, toId, newType);

// Remove connection
engine.unlinkBlocks(fromId, toId);
```

#### Querying Data

```javascript
// Get block by ID
const block = engine.getBlock(blockId);

// Search blocks by content
const results = engine.searchBlocks('search term');

// Get connected blocks
const outgoing = engine.getOutgoingLinks(blockId);
const incoming = engine.getIncomingLinks(blockId);

// Get connection information
const linkInfo = engine.getLinkInfo(fromId, toId);
// Returns: { type: 'single'|'reverse'|'double', from: id, to: id }
```

#### Data Persistence

```javascript
// Export all blocks to JSON
const jsonData = engine.exportToJSON();

// Import blocks from JSON
engine.importFromJSON(jsonData);
```

### BlockRenderer

#### View Modes

```javascript
// Switch between free positioning and grid layout
renderer.setViewMode('free');  // Default: draggable with connections
renderer.setViewMode('grid');  // Auto-layout grid without connections
```

#### Selection Management

```javascript
// Select blocks programmatically
renderer.selectBlock(blockId, multiSelect = false);

// Get selected blocks
const selected = renderer.getSelectedBlocks();

// Link selected blocks
renderer.linkSelected('double');
```

#### Visual Updates

```javascript
// Scroll to specific block
renderer.scrollToBlock(blockId);

// Update connections manually
renderer.updateConnections();

// Refresh minimap
renderer.updateMinimap();
```

### Event System

```javascript
// Subscribe to events
engine.on('blockCreated', (block) => {
    console.log('New block:', block);
});

engine.on('blockUpdated', (block) => {
    console.log('Block updated:', block);
});

engine.on('blocksLinked', ({from, to, linkType}) => {
    console.log('Blocks linked:', from.id, '->', to.id);
});

engine.on('blockMoved', (block) => {
    console.log('Block moved:', block.position);
});

engine.on('blockResized', (block) => {
    console.log('Block resized:', block.size);
});
```

## 💡 Examples

### Creating a Project Management Board

```javascript
// Create project overview
const overview = engine.createBlock(
    'Project: Block Engine\nDeadline: 2025-09-01',
    'note',
    {x: 400, y: 50}
);

// Create task blocks
const tasks = [
    engine.createBlock('Design UI Components', 'task', {x: 200, y: 200}),
    engine.createBlock('Implement Core Engine', 'task', {x: 400, y: 200}),
    engine.createBlock('Write Documentation', 'task', {x: 600, y: 200})
];

// Link overview to all tasks
tasks.forEach(task => {
    engine.linkBlocks(overview.id, task.id, 'single');
});

// Create task dependencies
engine.linkBlocks(tasks[0].id, tasks[1].id, 'single');
engine.linkBlocks(tasks[1].id, tasks[2].id, 'single');
```

### Building a Knowledge Graph

```javascript
// Create concept blocks
const concepts = {
    js: engine.createBlock('JavaScript', 'note'),
    dom: engine.createBlock('DOM Manipulation', 'note'),
    events: engine.createBlock('Event Handling', 'note'),
    async: engine.createBlock('Async Programming', 'note')
};

// Create relationships
engine.linkBlocks(concepts.js.id, concepts.dom.id, 'single');
engine.linkBlocks(concepts.js.id, concepts.events.id, 'single');
engine.linkBlocks(concepts.js.id, concepts.async.id, 'single');
engine.linkBlocks(concepts.events.id, concepts.dom.id, 'double');
```

## 🎨 Customization

### Custom Block Types

```javascript
class CustomBlockEngine extends BlockEngine {
    createBlock(content, type = 'default', position = null, size = null) {
        // Add custom validation
        if (type === 'important') {
            size = size || {width: 300, height: 200};
        }
        return super.createBlock(content, type, position, size);
    }
}
```

### Custom Styling

```css
/* Override default styles */
.block {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.block-type {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.link-endpoint {
    background: #ffd700; /* Gold endpoints */
}
```

### Extended Metadata

```javascript
// Add custom metadata to blocks
const block = engine.createBlock('Content');
block.customData = {
    priority: 'high',
    tags: ['important', 'review'],
    assignee: 'pavadik'
};
```

## 🔧 Configuration

### Engine Settings

```javascript
engine.settings = {
    gridSize: 20,          // Grid snapping size
    defaultSpacing: 300,   // Auto-position spacing
    minBlockWidth: 150,    // Minimum block width
    minBlockHeight: 100    // Minimum block height
};
```

## 🎯 Use Cases

- **Mind Mapping** - Visual brainstorming and idea organization
- **Project Management** - Task dependencies and workflow visualization
- **Knowledge Graphs** - Concept relationships and learning paths
- **System Design** - Architecture diagrams and component relationships
- **Content Planning** - Editorial calendars and content relationships
- **Data Modeling** - Entity relationships and database schemas

## 🏗️ Architecture

```
block-engine/
├── blockEngine.js      # Core engine logic
├── blockRenderer.js    # Visual rendering layer
├── example.html        # Usage example
└── README.md          # This file
```

### Key Components

1. **Block Engine** - Core data management and business logic
2. **Block Renderer** - Visual representation and interaction handling
3. **Event System** - Pub/sub for reactive updates
4. **Position Manager** - Grid snapping and auto-positioning
5. **Link Manager** - Connection routing and type management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Maintain zero dependencies
2. Follow ES6+ standards
3. Ensure mobile compatibility
4. Add JSDoc comments
5. Update documentation

## 📄 License

MIT License - feel free to use this in your projects!

---

<p align="center">
  Created with ❤️ by <a href="https://github.com/pavadik">Paul Dikaloff</a>
</p>