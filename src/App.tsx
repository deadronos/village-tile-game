import { Suspense } from 'react'
import React from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'
import { ECSProvider } from './ecs/ecsProvider'
import { GameContent } from './reactcomponents/GameContent'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'


function CanvasWrappedInECSProvider() {
  return (
    <ECSProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <Canvas className="game-canvas">
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls />
          <GameContent />
        </Canvas>
      </Suspense>
    </ECSProvider>
  )
} 



function App() {
  

  return (
    <div className="App">
      <div className="game-title">
        <h1>Village Tile Game</h1>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CanvasWrappedInECSProvider />
      </Suspense>
    </div>
  )
}

export default App
