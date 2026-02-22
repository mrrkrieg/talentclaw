#!/usr/bin/env node
import { buildCli } from "./cli/commands.js";

const cli = buildCli();
cli.parse(process.argv);
