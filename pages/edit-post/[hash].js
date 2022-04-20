import ReactMarkdown from 'react-markdown'
import { useState, useEffect } from 'react'
import { useContext } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { css } from '@emotion/css'
import { ethers } from 'ethers'
import { create } from 'ipfs-http-client'

import Blog from "../../artifacts/contracts/Blog.sol/Blog.json"
import { AccountContext } from '../../context'
import { contractAddress } from "../../config"
import { Button, HStack } from '@chakra-ui/react'

const ipfsURI = "https://ipfs.io/ipfs/"
const client = create("https://ipfs.infura.io:5001/api/v0")
const SimpleMDE = dynamic(
  () => import("react-simplemde-editor"),
  { ssr: false }
)

export default function EditPost() {
  const account = useContext(AccountContext)
  const router = useRouter()
  const [post, setPost] = useState(null)
  const [editing, setEditing] = useState(true)
  const { hash } = router.query

  useEffect(() => {
    getPost()
  }, [hash])

  const getPost = async () => {
    if (!hash) return

    let provider
    if (process.env.APP_ENV === 'local') {
      provider = new ethers.providers.JsonRpcProvider()
    } else if (process.env.APP_ENV === 'development') {
      provider = new ethers.providers.JsonRpcProvider("https://rpc-mumbai.matic.today/")
    } else {
      provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/")
    }

    const contract = new ethers.Contract(contractAddress, Blog.abi, provider)
    const post = await contract.getPost(hash)
    const postId = post[0].toNumber()

    const res = await fetch(`${ipfsURI}/${hash}`)
    const data = await res.json()

    if (data.coverImage) {
      const coverImagePath = `${ipfsURI}/${data.coverImage}`
      data.coverImagePath = coverImagePath
    }

    data.id = postId
    setPost(data)
  }

  const savePostToIpfs = async () => {
    try {
      const added = await client.add(JSON.stringify(post))
      return added.path
    } catch (err) {
      console.error('error: ', err)
    }
  }

  const updatePost = async () => {
    const hash = await savePostToIpfs()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(contractAddress, Blog.abi, signer)
    await contract.updatePost(post.id, post.title, hash, true)
    router.push("/")
  }

  if (!post) return null

  return (
    <div className={container}>
      {
        editing ? (
          <div>
            <input
              onChange={e => setPost({ ...post, title: e.target.value })}
              name='title'
              placeholder='Give it a title ...'
              value={post.title}
              className={titleStyle}
            />
            <SimpleMDE
              className={mdEditor}
              placeholder="What's on your mind?"
              value={post.content}
              onChange={value => setPost({ ...post, content: value })}
            />
          </div>
        ) : (
          <div>
            {
              post.coverImagePath && (
                <img 
                  src={post.coverImagePath} 
                  className={coverImageStyle} 
                  alt={post.title} 
                />
              )
            }
            <h1>{post.title}</h1>
            <div className={contentContainer}>
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
          </div>
        )
      }
      <HStack justifyContent="flex-start" alignItems="center" padding="10px 0">
        <Button onClick={() => setEditing(editing ? false : true)}>
          { editing ? "View Post" : "Edit Post" }
        </Button>
        <Button onClick={updatePost}>Update Post</Button>
      </HStack>
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