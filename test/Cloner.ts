import * as child_process from 'node/child_process';
import * as Fs from 'node/fs';
import * as Path from 'node/path';
import * as ChildProcess from 'node/child_process';
import * as stream from "node/stream";
import * as https from "node/https";

class Main{
    private angularVersion:string;
    private gitBaseUrl:string = '' ;
    private config :Object ;

    constructor(){
        this.getConfiguration()
        this.getFiles();
    }

    public static  changeModuleWrappers(data){
        var firstReplacement = "System.register(['./angular'], function(exports_1) {var index_1;return {setters:[function (index_1_1) {index_1 = index_1_1;}],execute: function() {";
        var secondReplacement ="exports_1('default',index_1.default);}}});";
        data = data.replace(/[(]function[(][-\s]?window, angular, undefined[-\s]?[)][-\s]?[{]/,firstReplacement)
            .replace(/}[)][(]window, window.angular[)][\s\S]*.*/,secondReplacement);
        return data;
    }

    public static changeAngularWrappers(data){
        var firstReplacement = "System.register([], function(exports_1) { return { setters:[], execute: function() {"
        var secondReplacement ='exports_1("angular", angular);exports_1("default",angular);}}});';
        data = data.replace(/[(]function[(]window, document, undefined[)] [{]'use strict';/,firstReplacement)
            .replace(/}[)][(]window, document[)];[\s\S]*.*/,secondReplacement);
        return data;
    }

    public getConfiguration(){
        let config  = Fs.readFileSync(Path.resolve(Path.resolve(__dirname,'../../'),'config'));
        this.config = JSON.parse(config.toString());
    }

    public getFiles(){
        Object.keys(this.config).forEach( ( repo ) => {
            console.log(this.config[repo].files);
            this.config[repo].files.map((fileName)=>{
                this.getFile(repo,this.config[repo].version,fileName).then((options)=>{
                    this.changeWrappers(options);
                });
            });
        });
    }

    public writeToSrcDir(fileName,data){
        let path  = Path.resolve(Path.resolve(__dirname,'../../src'),fileName);
        Fs.writeFileSync(path,data);
        console.log(`${fileName} has been successfully added to src directory`)
    }

    public changeWrappers(options){
        let fileName = options.fileName;
        let data     = options.data
        this.writeToSrcDir(fileName,(fileName!='angular.js') ? Main.changeModuleWrappers(data):Main.changeAngularWrappers(data))
    }

    public getFile(repo, version, fileName ){
        try{
            return new Promise((resolve, reject)=> {
                let req = https.request({
                    host: 'raw.githubusercontent.com',
                    path: `/angular/${repo}/${version}/${fileName}`,
                    method: 'GET',
                }, (res) => {
                    var data = '';
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                    res.on('end', () => {
                        resolve({"fileName":fileName,'data':data});
                    });
                    res.on('error', () => {
                        reject(false)
                    });
                });
                req.end()
            })
        }catch(e){
            console.log(e)
        }
    }

}
//let stream = new Main();
new Main();