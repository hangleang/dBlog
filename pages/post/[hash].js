import ReactMarkdown from 'react-markdown'
import { useContext } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { css } from '@emotion/css'
import { ethers } from 'ethers'

import Blog from "../../artifacts/contracts/Blog.sol/Blog.json"
import { AccountContext } from '../../context'
import { contractAddress } from "../../config"
import { Heading } from '@chakra-ui/react'

const ipfsURI = "https://ipfs.io/ipfs/"

export default function Post({ post }) {
  const account = useContext(AccountContext)
  const router = useRouter()
  const { hash } = router.query

  if (router.isFallback)
    return <div>Loading...</div>
  
  return (
    <div>
      {
        post && post.publisher == account && (
          <div className={container}>
            <div className={editPost}>
              <Link href={`/edit-post/${hash}`}>Edit Post</Link>
            </div>
          </div>
        )
      }
      {
        post.coverImage && (
          <img 
            src={post.coverImage} 
            className={coverImageStyle} 
            alt={post.title} 
          />
        )
      }
      <Heading size={2}>{post.title}</Heading>
      <div className={contentContainer}>
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </div>
  )
}

export async function getStaticPaths() {
  let provider

  if (process.env.APP_ENV === 'local') {
    provider = new ethers.providers.JsonRpcProvider()
  } else if (process.env.APP_ENV === 'development') {
    provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.matic.today/")
  } else {
    provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/")
  }

  const contract = new ethers.Contract(contractAddress, Blog.abi, provider)
  const data = await contract.getPosts()
  const paths = data.map(post => ({ params: { hash: post[2] } }))

  return {
    paths,
    fallback: true
  }
}

export async function getStaticProps({ params }) {
  const { hash } = params
  const res = await fetch(`${ipfsURI}/${hash}`)
  const data = await res.json();

  if (data.coverImage) {
    let coverImage = `${ipfsURI}/${data.coverImage}`
    data.coverImage = coverImage
  }

  return {
    props: {
      post: data
    }
  }
}

const editPost = css`
  margin: 20px 0px;
`

const coverImageStyle = css`
  width: 900px;
`

const container = css`
  width: 900px;
  margin: 0 auto;
`

const contentContainer = css`
  margin-top: 60px;
  padding: 0px 40px;
  border-left: 1px solid #e7e7e7;
  border-right: 1px solid #e7e7e7;
  & img {
    max-width: 900px;
  }
`