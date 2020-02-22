import { AiXformation, Post } from "../utils/interfaces";

const parseAiXformation = (raw: string, rawUsers: string, rawTags: string): AiXformation => {
    // Parse users
    const parsedUsers: any[] = JSON.parse(rawUsers);
    const users: any = {};
    parsedUsers.forEach((user: any) => users[user.id] = user);

    // Parse tags
    const parsedTags: any[] = JSON.parse(rawTags);
    const tags: any = {};
    parsedTags.forEach((tag: any) => tags[tag.id] = tag);

    // Parse posts
    const posts: any[] = JSON.parse(raw);
    const aixformation: AiXformation = {
        date: new Date().toISOString(),
        posts: []
    }

    aixformation.posts = posts.map((rawPost: any) => {
        const post: Post = {
            id: rawPost.id || '',
            title: rawPost.title?.rendered || '',
            content: rawPost.content?.rendered || '',
            url: rawPost.guid?.rendered || '',
            date: rawPost.date || '',
            thumbnailUrl: rawPost.jetpack_featured_media_url || '',
            mediumUrl: '',
            fullUrl: rawPost.link || '',
            author: users[rawPost.author]?.name || '',
            tags: rawPost.tags.map((tag: number) => tags[tag]?.name || '').filter((tag: string) => tag.length > 0)
        };
        return post;
    });

    return aixformation;
}

export default parseAiXformation;