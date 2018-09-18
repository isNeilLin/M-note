<template>
    <div class="fileLists">
        <ul>
            <li v-for="item in data"
                v-if="!item.deleted||(showDeleted&&item.deleted)"
                :class="item.selected  ? 'active' : ''" 
                @click="selectFile(item,$event)"
                @contextmenu="menuEvent(item,$event)"
                :key="item.title">
                <p class="fileTitle">{{item.title}}</p>
                <div class="fileDesc">
                    最近更新: <span>{{timeFormat(item.update)}}</span>
                </div>
            </li>
        </ul>
    </div>
</template>
<script>
    import electron from 'electron'
    import Evernote from 'evernote'
    const { remote } = electron;
    const { Menu, MenuItem, dialog } = remote;
    const callbackUrl = "http://localhost:9080/oauth_callback";
    var client = new Evernote.Client({
        consumerKey: 'neillin',
        consumerSecret: '079c9ef6fd5872aa',
        sandbox: true, // change to false when you are ready to switch to production
        china: false,
    })
    /* var client = new Evernote.Client({
        token: 'S=s1:U=940be:E=16d4351ea0f:C=165eba0bac0:P=1cd:A=en-devtoken:V=2:H=285af0989510d481c52f01dc46b327e9'
    }) */
    export default {
        data(){
            return {
                active: null,
                menuTarget: null,
                fileMenu: null
            }
        },
        props: ['data','showDeleted'],
        methods: {
            selectFile(){
               this.active = arguments[0];
               this.$emit('checkoutFile',this.active)
            },
            timeFormat(time){
                let format = num => num.toString().length > 1 ? num : `0${num}`
                let date = new Date(time);
                let Y, M, D, h, m, s;
                Y = date.getFullYear()
                M = format(date.getMonth() + 1)
                D = format(date.getDate())
                h = format(date.getHours())
                m = format(date.getMinutes())
                s = format(date.getSeconds())
                return `${Y}-${M}-${D} ${h}:${m}:${s}`
            },
            menuEvent(){
                this.menuTarget = arguments[0];
                let _this = this;
                let menuData;
                if(this.menuTarget.wastebasket){
                    menuData = [
                        {
                            label: '还原',
                            click: _this.reback
                        },{
                            label: '删除',
                            click: _this.clearFile
                        },{
                            label: '清倒废纸篓',
                            click: _this.clearAll
                        },
                    ]
                }else{
                    menuData = [
                        {
                            label: '新建文档',
                            click: _this.addFile
                        },{
                            type: 'separator'
                        },{
                            label: '导出为HTML',
                            click: _this.exportHTML
                        },{
                            label: '导出为PDF',
                            click: _this.exportPDF
                        },{
                            label: '导出为Markdown',
                            click: _this.exportMarkdown
                        },{
                            label: '发布到印象笔记',
                            click: _this.toEvernote
                        },{
                            type: 'separator'
                        },{
                            label: '移到废纸篓',
                            click: _this.deleteFile
                        }
                    ]
                }
                this.createMenu(menuData);
            },
            toEvernote(){
                let _this = this;
                client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret, confirm) {
                    if(error){
                        return alert(error.data);
                    }
                    localStorage.setItem('oauthToken',oauthToken)
                    localStorage.setItem('oauthTokenSecret',oauthTokenSecret)
                    if(confirm.oauth_callback_confirmed){
                        window.open(client.getAuthorizeUrl(oauthToken));
                    } 
                });
            },
            createMenu(data){
                this.fileMenu = new Menu();
                for(let item of data){
                    let mentItem = new MenuItem({
                        click: item.click || '',
                        label: item.label || '',
                        type: item.type || 'normal',
                        enabled: item.enabled || true,
                        visible: item.visible || true
                    })
                    this.fileMenu.append(mentItem);
                }
                this.fileMenu.popup();
            },
            addFile(){
                let belongTo = this.menuTarget.belongTo;
                this.$emit('addFile',{
                    title: '',
                    belongTo: belongTo
                })
            },
            exportHTML(){
                this.$emit('exportHTML')
            },
            exportPDF(){
                this.$emit('exportPDF')
            },
            exportMarkdown(){
                this.$emit('exportMarkdown')
            },
            deleteFile(){
                console.log(this.menuTarget)
                this.$emit('deleteFile', this.menuTarget);
            },
            reback(){
                this.$file.update({
                    _id: this.menuTarget._id
                },{
                    $set: {
                        deleted: false
                    }
                },(err)=>{
                    if(!err){
                        this.$emit('checkoutFolder','wastebasket')
                    }
                })
            },
            clearFile(){
                this.$file.remove({
                    _id: this.menuTarget._id
                },(err)=>{
                    if(!err){
                        this.$emit('checkoutFolder','wastebasket')
                    }
                })
            },
            clearAll(){
                this.$file.remove({
                    deleted: true
                },{
                    multi: true
                },(err)=>{
                    if(!err){
                        this.$emit('checkoutFolder','wastebasket')
                    }
                })
            }
        }
    }
</script>
<style>
    .fileLists {
        background: #f6f6f6;
        height: 100%;
    }
    .fileLists li {
        background: #f8f8f8;
        padding: 10px 6px;
        cursor: pointer;
    }
    p.fileTitle {
        color: rgb(51,51,51);
        height: 24px;
        line-height: 24px;
        width: 173px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }
    .fileDesc {
        font-size: 11px;
        line-height: 18px;
    }
    .fileDesc span {
        color: #a53737;
    }
    .fileLists li.active {
        background: #fff;
    }
    .active .fileTitle {
        color: #1976d2;
    }
</style>