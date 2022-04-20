const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Blog", function () {
  it("Should create post", async function () {
    const Blog = await ethers.getContractFactory("Blog");
    const blog = await Blog.deploy("My dBlog");
    await blog.deployed();
    await blog.createPost("my first blog", "first blog content hash");

    const post = await blog.getPost("first blog content hash");
    expect(post.title).to.equal("my first blog");
  });

  it("Should edit post", async function () {
    const Blog = await ethers.getContractFactory("Blog");
    const blog = await Blog.deploy("My dBlog");
    await blog.deployed();
    await blog.createPost("my another blog", "another blog content hash");
    
    await blog.updatePost(1, "my another blog (updated)", "new blog content hash", true);

    const posts = await blog.getPosts();
    expect(posts[0].title).to.equal("my another blog (updated)");
  });
});
