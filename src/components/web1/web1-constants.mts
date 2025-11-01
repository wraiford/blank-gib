import { IbGibDynamicComponentMeta } from "../../ui/component/component-types.mjs";
import { Web1ComponentMeta_About } from "./about/web1-about-component-one-file.mjs";
import { Web1ComponentMeta_Blog } from "./blog/web1-blog-component-one-file.mjs";
import { Web1ComponentMeta_Contact } from "./contact/web1-contact-component-one-file.mjs";
import { Web1ComponentMeta_Faq } from "./faq/web1-faq-component-one-file.mjs";
import { Web1ComponentMeta_Funding } from "./funding/web1-funding-component-one-file.mjs";
import { Web1ComponentMeta_Home } from "./home/web1-home-component-one-file.mjs";
import { Web1ComponentMeta_Links } from "./links/web1-links-component-one-file.mjs";
import { Web1ComponentMeta_Challenges } from "./challenges/web1-challenges-component-one-file.mjs";
import { Web1ComponentMeta_AboutProjects } from "./about-projects/web1-about-projects-component-one-file.mjs";

export const componentsMeta_Web1: IbGibDynamicComponentMeta[] = [
    new Web1ComponentMeta_Home(),
    new Web1ComponentMeta_Funding(),
    new Web1ComponentMeta_About(),
    new Web1ComponentMeta_Links(),
    new Web1ComponentMeta_Contact(),
    new Web1ComponentMeta_Blog(),
    new Web1ComponentMeta_Challenges(),
    new Web1ComponentMeta_Faq(),
    new Web1ComponentMeta_AboutProjects(),
];

export const WEB1_PAGES: string[] = [
    'home',
    'funding',
    'about',
    'links',
    'contact',
    'blog',
    'challenges',
    'faq',
    'about-projects',
]

export const GEMINI_SCHEMA_WEB1_PAGE = {
    type: 'string',
    enum: WEB1_PAGES.concat(),
    description: `kebab-cased string corresponding to a web 1.0 page on the website.`
}
