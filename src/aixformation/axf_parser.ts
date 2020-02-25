import { AiXformation } from '../utils/interfaces';
import entities from 'entities';
import got from 'got';
import sharp from 'sharp';
import fs from "fs";
import path from "path";
import stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

const tmpFolder = path.resolve('tmp', 'images');

const parseAiXformation = async (raw: string, rawUsers: string, rawTags: string): Promise<AiXformation> => {
    // Create image folder
    if (!fs.existsSync(tmpFolder)) {
        fs.mkdirSync(tmpFolder);
    }

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
    };

    for (let i = 0; i < posts.length; i++) {
        const rawPost: any = posts[i];
        await getImage(rawPost);
        aixformation.posts.push({
            id: rawPost.id || '',
            title: entities.decodeHTML(rawPost.title?.rendered || ''),
            url: rawPost.link || '',
            date: rawPost.date || '',
            author: users[rawPost.author]?.name || '',
            tags: rawPost.tags.map((tag: number) => tags[tag]?.name || '').filter((tag: string) => tag.length > 0)
        });
    }

    return aixformation;
};

const getImage = async (rawPost: any) => {
    const p = path.resolve(tmpFolder, (rawPost.id || '').toString());
    try {
        if (!fs.existsSync(p)) {
            await pipeline(
                got.stream(encodeURI(rawPost.jetpack_featured_media_url)),
                sharp().resize(null, 60).jpeg(),
                fs.createWriteStream(p)
            );
        }
    } catch (e) {
        fs.unlinkSync(p);
        console.log(e.body);
    }
};

export default parseAiXformation;
