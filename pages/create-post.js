import { useState, useEffect, useRef, useContext } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { css } from '@emotion/css'
import { ethers } from 'ethers'
import { create } from 'ipfs-http-client'

import Blog from "../artifacts/contracts/Blog.sol/Blog.json"
import { contractAddress } from "../config.js"
import { AccountContext } from '../context'

const client = create('https://ipfs.infura.io:5001/api/v0')
const SimpleMDE = dynamic(
  () => import("react-simplemde-editor"),
  { ssr: false }
)

export default function CreatePost() {
  const account = useContext(AccountContext)
  const initialState = { title: '', content: '', publisher: account }
  const [post, setPost] = useState(initialState)
  const [image, setImage] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const { title, content, publisher } = post

  const fileRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => setLoaded(true), 500)
  }, [])

  function onChange(e) {
    setPost(() => ({ ...post, [e.target.name]: e.target.value }))
  }

  async function savePostToIpfs() {
    try {
      const added = await client.add(JSON.stringify(post))
      return added.path
    } catch (err) {
      console.error('error: ', err)
    }
  }

  async function savePost(hash) {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, Blog.abi, signer)

      try {
        const txn = await contract.createPost(post.title, hash)
        await provider.waitForTransaction(txn.hash)
        return true
      } catch (err) {
        console.error('error: ', err)
        return false
      }
    }
  }

  async function createPost() {
    if (!title && !content && !account) return
    setSaving(true)
    const hash = await savePostToIpfs()
    const success = await savePost(hash)
    setSaving(false)
    if (success) router.push('/')
  }

  function triggerFileInput() {
    fileRef.current.click()
  }

  async function handleFileChange(e) {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    const added = await client.add(uploadedFile)
    setPost(state => ({ ...state, coverImage: added.path }))
    setImage(uploadedFile)
  }

  return (
    <div className={container}>
      {
        image && (
          <img 
            className={coverImageStyle} 
            src={URL.createObjectURL(image)} 
            alt={post.title} 
          />
        )
      }
      <input
        onChange={onChange}
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
      {
        loaded && (
          <>
            <button
              className={button}
              type='button'
              onClick={createPost}
            >{ saving ? "Saving..." : "Publish" }</button>
            <button
              onClick={triggerFileInput}
              className={button}
            >Add cover image</button>
          </>
        )
      }
      <input
        id='selectImage'
        className={hiddenInput} 
        type='file'
        onChange={handleFileChange}
        ref={fileRef}
      />
    </div>
  )
}

const hiddenInput = css`
  display: none;
`

const coverImageStyle = css`
  max-width: 800px;
`

const mdEditor = css`
  margin-top: 40px;
`

const titleStyle = css`
  margin-top: 40px;
  border: none;
  outline: none;
  background-color: inherit;
  font-size: 44px;
  font-weight: 600;
  &::placeholder {
    color: #999999;
  }
`

const container = css`
  width: 800px;
  margin: 0 auto;
`

const button = css`
  background-color: #fafafa;
  outline: none;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  margin-right: 10px;
  font-size: 18px;
  padding: 16px 70px;
  box-shadow: 7px 7px rgba(0, 0, 0, .1);
`
