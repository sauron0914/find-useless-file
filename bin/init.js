#!/usr/bin/env node

const { resolve } = require('path')
const program = require('commander')
const { version } = require(resolve(__dirname, '../package.json'))
const commands = require(resolve(__dirname, "../dist/bundle.js"))

process.env.NODE_PATH = resolve(__dirname, "../node_modules/")

program.version(version)

program.usage('<command>')

program
    .command('do')
    .description('create your Template')
    .action(commands.findUselessComponents)

program.parse(process.argv)

if(!program.args.length){
    program.help()
}