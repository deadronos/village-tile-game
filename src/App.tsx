import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import './App.css'
import { ECSProvider } from './ecs/ecsProvider'
import { GameContent } from './reactcomponents/GameContent'
import { OrbitControls } from '@react-three/drei/core/OrbitControls'
import HudUI from './reactcomponents/HudUI'

function CanvasWrappedInECSProvider() {
  return (
    <ECSProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <HudUI />
        <Canvas className="game-canvas">
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
      <Suspense fallback={<div>Loading...</div>}>
        <CanvasWrappedInECSProvider />
      </Suspense>
    </div>
  )
}

export default App
