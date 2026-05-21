import { Suspense } from 'react'
import React from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'





function App() {
  

  return (
    <div className="App">
        <h1>Village Tile Game</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <Canvas>
            
          </Canvas>
        </Suspense>
    </div>
  )
}

export default App
