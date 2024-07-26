import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect } from 'react';

function App() {
  const [directoryItems, setDirectoryItems] = useState(['../']);
  const [previousDirectoryPath, setPreviousDirectoryPath] = useState('/home/christopher/Pictures/wallpapers');
  const [directoryPath, setDirectoryPath] = useState('/home/christopher/Pictures/wallpapers');
  const [activeDirectoryItem, setActiveDirectoryItem] = useState(-1);
  const [gridMode, setGridMode] = useState(false);
  const [directoryHistory, setDirectoryHistory] = useState([directoryPath]);
  const [directoryHistoryCurrentIndex, setDirectoryHistoryCurrentIndex] = useState(0);

  const loadDirectory = (newDirectory) =>{
    console.log("Attempting to load directory: " + newDirectory);
    fetch('http://localhost:8000/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: newDirectory
    })
      .then(response => response.json())
      .then(data => {
        setDirectoryPath(newDirectory);
        setDirectoryItems([{type: 'Directory', location: "../", thumbnail: false}, ...data.contents]);
      });
  }

  const requestFileLaunch = (filePath) =>{
    fetch('http://localhost:8000/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: filePath
    })
      .then(response => response.json())
      .then(data => {
        // console.log(data);
      });
  }

  // If mouse back button is clicked, go back in directory history
  useEffect(() =>{
    const handleBackButton = (e) =>{
      if(e.button === 3){
        console.log("Back button pressed");
        console.log("Directory history length: " + directoryHistory.length);
        console.log("Directory history current index: " + directoryHistoryCurrentIndex);
        if(directoryHistoryCurrentIndex > 0){
          setDirectoryHistoryCurrentIndex(directoryHistoryCurrentIndex-1);
        }
      }
    }
    window.addEventListener('mouseup', handleBackButton);
    return () => window.removeEventListener('mouseup', handleBackButton);
  }, [directoryHistory])

  useEffect(() =>{
    if(directoryHistoryCurrentIndex < 0){
      setDirectoryHistoryCurrentIndex(0);
    }
    if(directoryHistoryCurrentIndex >= directoryHistory.length){
      setDirectoryHistoryCurrentIndex(directoryHistory.length-1);
    }
    if(directoryHistoryCurrentIndex < directoryHistory.length){
      loadDirectory(directoryHistory[directoryHistoryCurrentIndex]);
    }
  }, [directoryHistoryCurrentIndex])

  useEffect(() =>{
    console.log("Directory history is now: " + directoryHistory);
    console.log("Directory history current index is now: " + directoryHistoryCurrentIndex);
    setDirectoryHistoryCurrentIndex(directoryHistory.length-1);

  }, [directoryHistory])

  useEffect(() =>{
    loadDirectory(directoryPath);
  }, [])

  const directoryItemClickHandler = (index) =>{
    console.log(index);
    setActiveDirectoryItem(index);
  }

  const directoryItemDoubleClickHandler = (name, fileType) => {
    setDirectoryHistory([...directoryHistory, directoryPath]);
    switch (fileType){
      case 'Directory':
        console.log(directoryPath + "/" + name)
        if(name === '../'){
          setDirectoryHistory([...directoryHistory, directoryPath.substring(0, directoryPath.lastIndexOf('/'))]);
          loadDirectory(directoryPath.substring(0, directoryPath.lastIndexOf('/')));
          return;
        }
        setDirectoryHistory([...directoryHistory, name]);
        loadDirectory(name);
        break;
      case 'File':
        requestFileLaunch(name);
        break;
    }
    
  }

  return (
    <div className="App">
      <div className="Toolbar">
        <span className="Directory-Path-Bar">{
        directoryPath.split("/").slice(1).map((item, index) =>{
          return (
          <span>
            {index !== 0 && <i class="fa-solid fa-chevron-right"></i>}
            <span className="Directory-Path-Text" onClick={()=>{
              if(directoryPath.split("/").slice(0, index+2).join("/") !== directoryPath){
                setDirectoryHistory(prev => [...prev, directoryPath.split("/").slice(0, index+2).join("/")]);
                loadDirectory(
                  directoryPath.split("/").slice(0, index+2).join("/")
                );
              }
              }}>{item}
            </span>
          </span>)
        })}
        </span>
        <div onClick={()=>{setGridMode(!gridMode)}} className={(!gridMode ? "Directory-Display-Type-Toggle" : "Directory-Display-Type-Toggle Grid-Mode-Enabled")}>
          {
            gridMode ? <i class="fa-solid fa-bars"></i> : <i class="fa-solid fa-list"></i>
          }
        </div>
      </div>
      
      <div className={(gridMode ? "Directory-Tree-Grid" : "Directory-Tree")}>
        {directoryItems && directoryItems.map((item, index) => (
          <DirectoryItem directoryItemClickHandler={directoryItemClickHandler} 
          directoryItemDoubleClickHandler={directoryItemDoubleClickHandler} 
          index={index} 
          isActive={index===activeDirectoryItem} 
          name={item.location}
          fileType={item.type}
          gridMode={gridMode}
          thumbnail={item.thumbnail}
          key={index}/>
        ))}
      </div>
    </div>
  );
}

function DirectoryItem(props){
  const getFileNameFromPath = (path) =>{
    if(path === '../'){
      return path;
    }
    return path.substring(path.lastIndexOf('/')+1);
  }
  return(
    <div onClick={()=>{props.directoryItemClickHandler(props.index)}} 
    onDoubleClick={()=>{props.directoryItemDoubleClickHandler(props.name, props.fileType)}} 
    className={props.isActive ? (props.gridMode ? "Directory-Item-Active Directory-Item-Grid" : "Directory-Item Directory-Item-Active") : props.gridMode ? "Directory-Item-Grid" : "Directory-Item"}
    // Set the div's background image to the thumbnail if it exists
    style={props.thumbnail ? {backgroundImage: "url('data:image/png;base64, " + props.thumbnail + "')"} : {}}
    
    >
      {props.fileType && props.fileType === "Directory" ? <i class="fa-solid fa-folder"></i> : 
        (!props.gridMode && 
          props.thumbnail 
          ? <img src={"data:image/png;base64, " + props.thumbnail} alt="thumbnail" /> 
        : (props.gridMode && props.thumbnail ? null : <i class="fa-solid fa-file"></i>))
      }
      <p>{props.name && getFileNameFromPath(props.name)}</p>
    </div>
  )
}

export default App;
