import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../../keystatic.config";
import { editorAvailable } from "@/lib/editor/availability";

const handlers = makeRouteHandler({ config });
const off = () => new Response("Not found", { status: 404 });

/** Saves and loads content for the editing screen. Off on a live site unless GitHub storage is set up. */
export const GET = editorAvailable ? handlers.GET : off;
export const POST = editorAvailable ? handlers.POST : off;
