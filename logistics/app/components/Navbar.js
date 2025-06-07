import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Navbar = () => {
    return (
        <nav className=' text-white p-4 flex justify-between items-center'>
            <div className='flex gap-5 '>
                <Image className='mt-0.5' src="/assets/logo.png" alt='Logo' width={50} height={50} />
                <span className='text-3xl mt-2 font-bold'>Logistique</span>
            </div>

            <ul className='flex space-x-4 gap-5 justify-between px-2 text-lg'>
                <li>
                    <Link href="/home">Home</Link>
                </li>
                <li>
                    <Link href="/about">About</Link>
                </li>
                <li>
                    <Link href="/contact">Contact</Link>
                </li>
            </ul>
        </nav>
    )
}

export default Navbar
