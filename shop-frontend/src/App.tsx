
import './App.css'
import { CardWrapper } from './components/cards-wrapper'
import { Dialog } from './components/dialog'
import { useState } from 'react'

function App() {
  const [isDialogOpen, setDialogOpen] = useState(false)

  return (
    <div className='min-h-screen w-screen flex flex-col p-2'>
      <header className=' bg-white/25 p-2 rounded-md w-full flex justify-between items-center '>
        <h2 className='text-lg font-semibold'>Магазин Тёмная Зина</h2>
        <button onClick={()=>{setDialogOpen(true)}}>Добавить товар</button>
      </header>
      <main className=''>
        <CardWrapper/>
      </main>
      <Dialog isOpen={ isDialogOpen } onClose={() => setDialogOpen(false)}/>
    </div>
  )
}

export default App
