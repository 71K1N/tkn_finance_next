import Link from 'next/link'

export default function navbar() {
    return(
        <>
            <nav>
                <Link href="/">Home</Link> |
                <Link href="/category/">Category</Link> |
                <Link href="/subcategory/">Subcategory</Link> |
                <Link href="/account/">Accounts</Link>
            </nav>            
        </>
    )
    
}