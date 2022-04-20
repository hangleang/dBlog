import Link from 'next/link'
import { css } from '@emotion/css'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'

import Blog from "../artifacts/contracts/Blog.sol/Blog.json"
import { contractAddress } from "../config.js"

export default function Home(props) {
  const { posts } = props
  const router = useRouter()

  if (posts && !posts.length) 
    return (
      <div className={container}>
        <button className={buttonStyle} onClick={async () => await router.push('/create-post')}>
          Create your first post
        </button>
      </div>
    )
  
  return (
    <div className={postList}>
      {
        posts.map((post, index) => (
          <Link href={`/post/${post[2]}`} key={index}>
            <a>
            <div className={linkStyle}>
              <p className={postTitle}>{post[1]}</p>
            </div>
            </a>
          </Link>
        ))
      }
    </div>
  )
}

export async function getServerSideProps() {
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

  return {
    props: {
      posts: JSON.parse(JSON.stringify(data))
    }
  }
}

const arrowContainer = css`
  display: flex;
  flex: 1;
  justify-content: flex-end;
  padding-right: 20px;
`

const postTitle = css`
  font-size: 30px;
  font-weight: bold;
  cursor: pointer;
  margin: 0;
  padding: 20px;
`

const linkStyle = css`
  border: 1px solid #ddd;
  margin-top: 20px;
  border-radius: 8px;
  display: flex;
`

const postList = css`
  width: 700px;
  margin: 0 auto;
  padding-top: 50px;  
`

const container = css`
  display: flex;
  justify-content: center;
`

const buttonStyle = css`
  margin-top: 100px;
  background-color: #fafafa;
  outline: none;
  border: none;
  font-size: 44px;
  padding: 20px 70px;
  border-radius: 15px;
  cursor: pointer;
  box-shadow: 7px 7px rgba(0, 0, 0, .1);
`

const arrow = css`
  width: 35px;
  margin-left: 30px;
`

const smallArrow = css`
  width: 25px;
`