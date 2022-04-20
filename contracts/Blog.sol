//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Blog is Ownable {
    event PostCreated(uint id, string title, string _hash);
    event PostUpdated(uint id, string title, string _hash, bool published);

    struct Post {
        uint id;
        string title;
        string content;
        address publisher;
        bool published;
    }

    string public name;
    uint private latestPostId;

    mapping(uint => Post) private idToPost;
    mapping(string => Post) private hashToPost;

    constructor(string memory _name) {
        console.log("Deploy with name: ", name);
        name = _name;
    }

    function updateName(string memory _name) public onlyOwner {
        name = _name;
    }   

    function getPost(string memory _hash) public view returns (Post memory) {
        return hashToPost[_hash];
    }

    function createPost(string memory title, string memory _hash) public {
        Post memory post = Post({
            id: ++latestPostId,
            title: title,
            content: _hash,
            publisher: msg.sender,
            published: true
        });
        hashToPost[_hash] = post;
        idToPost[latestPostId] = post;

        emit PostCreated(latestPostId, title, _hash);
    }

    function updatePost(uint id, string memory title, string memory _hash, bool published) public {
        require(idToPost[id].publisher == msg.sender, "forbidden");
        Post storage post = idToPost[id];
        post.title = title;
        post.content = _hash;
        post.published = published;
        hashToPost[_hash] = post;

        emit PostUpdated(id, title, _hash, published);
    }

    function getPosts() public view returns (Post[] memory posts) {
        posts = new Post[](latestPostId);
        
        for(uint i=1; i<=latestPostId; i++) {
            posts[i-1] = idToPost[i];
        }

        return posts;
    } 
}
