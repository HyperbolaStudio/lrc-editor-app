import { watcher } from "../lib/watcher";
import * as path from 'path'
import { configDir } from "../lib/lifecycle";

watcher(path.join(configDir,'.watcher'));