import React from 'react'
import { ECS } from './ecs/ecsImpl'



export const ECSContext = React.createContext(ECS)

export const ECSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ECSContext.Provider value={ECS}>
            {children}
        </ECSContext.Provider>
    )
}

export const useECS = () => {
    const ecs = React.useContext(ECSContext)
    if (!ecs) {
        throw new Error("useECS must be used within an ECSProvider")
    }
    return ecs
}