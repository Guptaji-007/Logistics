import React from 'react'
import AdminAccountMenu from './AdminAc'
import Image from 'next/image'
import Link from 'next/link'

const AdminNav = () => {
  return (
    <>
      <nav className="text-white p-4 flex justify-between items-center">
        <div className="flex gap-5">
          <Image className="mt-0.5" src="/assets/logo.png" alt="Logo" width={50} height={50} />
          <Link href="/" className="text-3xl mt-2 font-bold">Logistique</Link>
        </div>
        
        <ul className="flex space-x-4 gap-4 justify-between px-2 text-lg">
        <li><AdminAccountMenu /></li>
      </ul>
      </nav>
    </>
  )
}

export default AdminNav