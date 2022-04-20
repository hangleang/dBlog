import { BigInt, ipfs, json } from "@graphprotocol/graph-ts"
import {
  Blog,
  PostCreated,
  PostUpdated
} from "../generated/Blog/Blog"
import { Post } from "../generated/schema"

export function handlePostCreated(event: PostCreated): void {
  let entity = Post.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new Post(event.params.id.toString())

    // Entity fields can be set using simple assignments
    entity.title = event.params.title
    entity.contentHash = event.params._hash
    entity.published = true
    const data = ipfs.cat(event.params._hash)

    if (data) {
      const val = json.fromBytes(data).toObject()
      if (val) {
        const content = val.get("content")
        const publisher = val.get("publisher")

        if (content) {
          entity.content = content.toString()
        }
        if (publisher) {
          entity.publisher = publisher.toString()
        }
      }
    }

    entity.createdAt = event.block.timestamp
    entity.save()
  }
}

export function handlePostUpdated(event: PostUpdated): void {
  let entity = Post.load(event.params.id.toString())

  if (entity) {
    entity.title = event.params.title
    entity.contentHash = event.params._hash
    entity.published = event.params.published
    const data = ipfs.cat(event.params._hash)

    if (data) {
      const val = json.fromBytes(data).toObject()
      if (val) {
        const content = val.get("content")

        if (content) {
          entity.content = content.toString()
        }
      }
    }

    entity.updatedAt = event.block.timestamp
    entity.save()
  }
}
