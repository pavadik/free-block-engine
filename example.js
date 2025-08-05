    // Initialize the engine and renderer
    const engine = new BlockEngine();
    const renderer = new BlockRenderer(engine, 'blocks-container');
    
    // Status updates
    function updateStatus(message) {
      document.getElementById('status').textContent = message;
      setTimeout(() => {
        document.getElementById('status').textContent = '';
      }, 3000);
    }
    
    // Create a new block
    function createNewBlock() {
      const content = prompt('Enter block content:');
      if (content !== null) {
        const block = engine.createBlock(content);
        updateStatus(`Block ${block.id.substring(0, 8)}... created`);
      }
    }
    
    // Link selected blocks
    function linkSelectedBlocks() {
      const linkType = document.getElementById('linkTypeSelect').value;
      renderer.linkSelected(linkType);
      updateStatus(`Blocks linked with ${linkType} connection`);
    }
    
    // Auto arrange blocks
    function arrangeBlocks() {
      engine.arrangeBlocks(3);
      updateStatus('Blocks arranged');
    }
    
    // Set view mode
    function setViewMode(mode) {
      renderer.setViewMode(mode);
      document.getElementById('freeViewBtn').classList.toggle('active', mode === 'free');
      document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');
      updateStatus(`Switched to ${mode} view`);
    }
    
    // Search blocks
    function searchBlocks() {
      const query = document.getElementById('searchInput').value;
      if (query) {
        const results = engine.searchBlocks(query);
        updateStatus(`Found ${results.length} blocks`);
        // Highlight search results
        document.querySelectorAll('.block').forEach(el => {
          const blockId = el.dataset.blockId;
          const isResult = results.some(block => block.id === blockId);
          el.style.opacity = isResult ? '1' : '0.3';
        });
      } else {
        // Reset opacity
        document.querySelectorAll('.block').forEach(el => {
          el.style.opacity = '1';
        });
      }
	      }
    
    // Export data
    function exportData() {
      const data = engine.exportToJSON();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blocks_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      updateStatus('Data exported');
    }
    
    // Import data
    function importData() {
      document.getElementById('importFile').click();
    }
    
    function handleImport(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (engine.importFromJSON(e.target.result)) {
            updateStatus('Data imported successfully');
          } else {
            updateStatus('Import failed');
          }
        };
        reader.readAsText(file);
      }
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N: New block
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewBlock();
      }
      
      // Ctrl/Cmd + L: Link selected
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        linkSelectedBlocks();
      }
      
      // Delete: Delete selected blocks
      if (e.key === 'Delete' && !e.target.contentEditable) {
        const selected = renderer.getSelectedBlocks();
        if (selected.length > 0 && confirm(`Delete ${selected.length} blocks?`)) {
          selected.forEach(block => engine.deleteBlock(block.id));
          renderer.selectedBlocks.clear();
        }
      }
      
      // Escape: Clear selection
      if (e.key === 'Escape') {
        renderer.selectedBlocks.clear();
        renderer.render();
      }
    });
    
    // Create some example blocks with different link types
    window.addEventListener('DOMContentLoaded', () => {
      // Create sample blocks
      const block1 = engine.createBlock('Project Overview\n\nThis is the main project hub with links to all components.', 'note', {x: 400, y: 100});
      const block2 = engine.createBlock('Task 1: Design UI\n\nCreate mockups and wireframes for the user interface.', 'task', {x: 100, y: 300});
      const block3 = engine.createBlock('Task 2: Backend API\n\nDevelop RESTful API endpoints for data management.', 'task', {x: 400, y: 300});
      const block4 = engine.createBlock('Task 3: Testing\n\nWrite unit tests and integration tests.', 'task', {x: 700, y: 300});
      const block5 = engine.createBlock('Resources\n\n- Documentation\n- API Reference\n- Design Guidelines', 'note', {x: 250, y: 500});
      const block6 = engine.createBlock('Dependencies\n\nExternal libraries and frameworks used in the project.', 'note', {x: 550, y: 500});
      
      // Create different types of links
      engine.linkBlocks(block1.id, block2.id, 'single');  // Project → Task 1
      engine.linkBlocks(block1.id, block3.id, 'single');  // Project → Task 2
      engine.linkBlocks(block1.id, block4.id, 'single');  // Project → Task 3
      engine.linkBlocks(block2.id, block3.id, 'single');  // Task 1 → Task 2
      engine.linkBlocks(block3.id, block4.id, 'single');  // Task 2 → Task 3
      engine.linkBlocks(block5.id, block1.id, 'reverse'); // Resources ← Project
      engine.linkBlocks(block6.id, block3.id, 'double');  // Dependencies ↔ Task 2
      
      updateStatus('Welcome! Double-click on arrows to edit link directions.');
      
      // Hide help text after 10 seconds
      setTimeout(() => {
        const helpText = document.querySelector('.help-text');
        if (helpText) {
          helpText.style.opacity = '0';
          helpText.style.transition = 'opacity 0.5s';
          setTimeout(() => helpText.remove(), 500);
        }
      }, 10000);
    });