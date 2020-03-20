import {AiXformation} from '../utils/interfaces';
import crypto from 'crypto';
import got from 'got';
import sharp from 'sharp';
import fs from "fs";
import path from "path";
import stream from "stream";
import {promisify} from "util";
import {getValue, setValue} from './axf_db';
import {decodeHTML} from "entities";

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
            title: decodeHTML(rawPost.title?.rendered || ''),
            url: rawPost.link || '',
            date: new Date(rawPost.date_gmt).toISOString() || '',
            author: users[rawPost.author]?.name || '',
            tags: rawPost.tags.map((tag: number) => tags[tag]?.name || '').filter((tag: string) => tag.length > 0),
        });
    }

    return aixformation;
};

const getImage = async (rawPost: any) => {
    const url: string = rawPost.jetpack_featured_media_url;
    const urlHash = crypto.createHash('sha1').update(url).digest('hex');
    const lastUrl = await getValue(`img-${rawPost.id}`);

    // If the image url did not changed, do not download the image again
    if (lastUrl && lastUrl === urlHash) {
        return;
    }
    setValue(`img-${rawPost.id}`, urlHash);

    console.log('Update aixformation image');
    const p = path.resolve(tmpFolder, (rawPost.id || '').toString());
    try {
        await pipeline(
            got.stream(encodeURI(url)),
            sharp().resize(null, 60).jpeg(),
            fs.createWriteStream(p)
        );
    } catch (e) {
        try {
            fs.unlinkSync(p);
        } catch (e) {

        }
        console.log(e.body);
    }
};

export default parseAiXformation;
