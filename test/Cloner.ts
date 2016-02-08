import * as child_process from 'node/child_process';
import * as Fs from 'node/fs';
import * as Path from 'node/path';
import * as ChildProcess from 'node/child_process';
import * as stream from "node/stream";
import * as https from "node/http";

class Main{
    private angularVersion:string;
    private gitBaseUrl:string ;
    private projects :Object;
    constructor(){
        this.projects = {
            "angular"         : "v1.5.0",
            "material"        : "v1.0.5",
            "angular-aria"    : "v1.5.0",
            "angular-animate" : "v1.5.0",
            "angular-route"   : "v1.5.0"
        };
        this.cloneAllRepo();
    }

    public  cloneAllRepo(){
        Object.keys(this.projects).forEach( ( k) => {
            this.cloneRepo(this.projects[k],k).then((val)=>{
                this.changeWrappers(k);
            });
        });
    }

    changeModuleWrappers(data){
        var firstReplacement = "System.register(['./angular'], function(exports_1) {var index_1;var RouteProvider;return {setters:[function (index_1_1) {index_1 = index_1_1;}],execute: function() {";
        var secondReplacement ="exports_1('default',index_1.default);}}});";
        ///[(]function[(][-\s]?window, angular, undefined [)][{][\n+]?"use strickt";/
        data = data.replace(/[(]function[(][-\s]?window, angular, undefined[-\s]?[)][-\s]?[{]/,firstReplacement)
            .replace(/}[)][(]window, window.angular[)][\s\S]*.*/,secondReplacement);
        return data;
    }

    changeAngularWrappers(data){
        var firstReplacement = "System.register(['./angular'], function(exports_1) {var index_1;var RouteProvider;return {setters:[function (index_1_1) {index_1 = index_1_1;}],execute: function() {";
        var secondReplacement ="exports_1('default',index_1.default);}}});";
        "(function(window, document, undefined) {'use strict';"
        data = data.replace(/[(]function[(]window, document, undefined[)] [{]'use strict';/,firstReplacement)
            .replace(/}[)][(]window, document[)];[\s\S]*.*/,secondReplacement);
        return data;
}

    public deleteDirectory (path){
        var _this =this;
        if( Fs.existsSync(path) ) {
            Fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(Fs.lstatSync(curPath).isDirectory()) {
                    _this.deleteDirectory(curPath);
                } else {
                    Fs.unlinkSync(curPath);
                }
            });
            Fs.rmdirSync(path);
        }
    }

    public changeWrappers(name){
        let dir   = Path.resolve(__dirname,`../../bower-${name}`);
        if(name =='material'){
            name = 'angular-material';
            let cssData  =  Fs.readFileSync(Path.resolve(dir,`${name}.css`));
            this.writeToSrcDir(`${name}.css`,cssData);
        }
        let data =  Fs.readFileSync(Path.resolve(dir,`${name}.js`));
        this.writeToSrcDir(`${name}.js`,(name!='angular') ? this.changeModuleWrappers(data.toString()):this.changeAngularWrappers(data.toString()))
        this.deleteDirectory(dir);
        console.log(`bower-${name} lib modified successfully`)
    }

    writeToSrcDir(fileName,data){
        let path  = Path.resolve(Path.resolve(__dirname,'../../src'),fileName);
        Fs.writeFileSync(path,data);
        console.log(`${fileName} added to your src directory`)
    }

    public cloneRepo(version:string,gitPath:string){
        var spawn = ChildProcess.spawn;
        return new Promise((resolve, reject)=>{
            const ls = spawn('git',['clone','--branch',version,'https://github.com/angular/bower-'+gitPath+'.git']);
            ls.stdout.on('data', (data) => {
                console.log(`${data}`);
            });
            ls.stderr.on('data', (data) => {
                console.log(`${data}`);
            });
            ls.on('close', (code) => {
                console.log(`${gitPath} cloned successfully`);
                resolve(gitPath);
            });
            ls.on('error', (code) => {
                console.log(`child process exited with code ${code}`);
                reject(false);
            });
        });
    }

}
//let stream = new Main();
new Main();