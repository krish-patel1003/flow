// draggableNode.js
import "./draggableNode.css"
export const DraggableNode = ({ type, label, img, disabled = false }) => {
    const onDragStart = (event, nodeType) => {
      if (disabled) {
        return;
      }
      const appData = { nodeType }
      event.target.style.cursor = 'grabbing';
      event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
      event.dataTransfer.effectAllowed = 'move';
    };
  
    return (
      <div
        className='draggable-node'
        onDragStart={(event) => onDragStart(event, type)}
        onDragEnd={(event) => (event.target.style.cursor = disabled ? 'not-allowed' : 'grab')}
        draggable={!disabled}
        style={{
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'grab',
          position: 'relative',
        }}
      >
        <img src={img} alt={label}/>
          <span >{label}</span>
          {disabled ? (
            <small style={{ position: 'absolute', bottom: 4, right: 6 }}>Coming soon</small>
          ) : null}
      </div>
    );
  };
  
