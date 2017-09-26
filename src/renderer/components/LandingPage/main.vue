<template>
    <div class="container">
        <div id="markdown_editor"
        class="markdown_editor"
        ref="editor"
        @paste="saveContent"
        @keydown="keyUp">
            <textarea v-model="data.content"></textarea>
        </div>
        <div class="disableEditor" v-if="disable">
        </div>
        <div class="watch" v-if="watch" ref="watch" v-html="previewContent"></div>
    </div>
</template>
<script>
    import $script from 'scriptjs';
    export default {
        mounted(){
            $script(`${this.editorPath}js/editormd.js`, () => {
                console.log('init Editor')
                this.initEditor();
            });
        },
        data(){
            return {
                disable: false,
                editor: null,
                fileTitle: this.data.title,
                preview: '',
                editorPath: 'static/',
                watch: false,
                previewContent: '',
                editorConfig: {
                    width: '100%',
                    height: '100%',
                    mode: 'markdown',
                    name: 'markdown_editor',
                    path: 'static/js/',
                    codeFold: false,
                    saveHTMLToTextarea: false,
                    searchReplace: true,
                    htmlDecode: 'style,script,iframe|on*',
                    emoji: true,
                    pageBreak: false,
                    lineNumbers:false,
                    lineWrapping:false,
                    fontSize: '14px',
                    taskList: true,
                    pluginPath: 'static/plugins/',
                    toc: true,
                    tocm: true,                  // Using [TOCM]
                    tex: true,                   // 开启科学公式TeX语言支持，默认关闭
                    flowChart: false,             // 开启流程图支持，默认关闭
                    sequenceDiagram: false,       // 开启时序/序列图支持，默认关闭,
                    imageUpload: true,
                    toolbar: false,
                    placeholder: '# 这里添加标题',
                    watch: true,
                    imageFormats: ['jpg', 'jpeg', 'gif', 'png', 'bmp', 'webp'],
                    onload: () => {
                        let content = this.editor.getMarkdown();
                        let fileTitle = content.split(/\n/)[0];
                        this.fileTitle = fileTitle.replace('#','');
                        this.editor.preview[0].style.display = 'none';
                    },
                }
            }
        },
        methods: {
            keyUp(e){
                let title = document.title;
                if(!title.endsWith('*')){
                    title = document.title + '*';
                    document.title = title;
                }
                if(this.watch){
                    this.previewContent = this.editor.preview[0].innerHTML;
                }
                if(((e.metaKey||e.ctrlKey)&&e.keyCode===83)||e.keyCode===13){
                    this.saveContent();
                }
            },
            rangeToLast(el){
                let sel = window.getSelection();
                let range = document.createRange();
                range.selectNodeContents(el);
                range.collapse();
                sel.removeAllRanges();
                sel.addRange(range);
            },
            initEditor() {
                this.editor = editormd('markdown_editor', this.editorConfig);
            },
            saveContent(){
                let title = document.title;
                let _this = this;
                setTimeout(function() {
                    let content = _this.editor.getMarkdown();
                    _this.$emit('saveContent',content);
                    let fileTitle = content.split(/\n/)[0];
                    fileTitle = fileTitle.replace('#','');
                    if(fileTitle !== this.fileTitle){
                        _this.fileTitle = fileTitle;
                        _this.$emit('changeFileTitle',fileTitle)
                    }
                    title = title.replace('*','');
                    document.title = title;
                }, 200);
            },
            showContent(content){
                this.editor.setValue(content);
                this.$refs.editor.focus();
                this.rangeToLast(this.$refs.editor);
            }
        },
        props: ["data"]
    }
</script>
<style>
    .container {
        height: 100%;
        position: relative;
        display: flex;
    }
    .markdown_editor {
        height: 100%;
        outline: none;
        overflow-y: auto;
        width: auto;
        flex-grow: 1;
    }
    .watch {
        min-width: 50%;
        max-width: 50%;
        overflow-y: auto
    }
    .disableEditor {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background: floralwhite;
        overflow-y: auto;
        z-index: 99999;
    }
    .editormd {
        margin: 0 !important;
    }
    .cm-header {
        color: rgb(51,51,51) !important;
    }
    .cm-header-1 {
        font-size: 26px;
    }
    .cm-header-2 {
        font-size: 22px;
    }
    .cm-header-3 {
        font-size: 20px;
    }
    .cm-header-4 {
        font-size: 18px;
    }
    .cm-header-5 {
        font-size: 16px;
    }
    .cm-header-6 {
        font-size: 14px;
    }
    pre {
        white-space: pre-wrap;
        word-break: break-all;
    }
    pre .cm-link {
        color: rgb(29, 117, 179) !important;
    }
    .container .editormd-preview {
        display: none;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 999;
        width: 100% !important;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-all;
    }
    .CodeMirror {
        background: rgba(250,235,215,.5) !important;
        width: 100% !important;
        padding-top: 16px;
    }
    .CodeMirror pre{
        white-space: pre-wrap !important;
        word-break: break-word !important;
    }
    .CodeMirror-foldgutter {
        background: rgba(250,235,215,.4) !important;
    }
    .CodeMirror-activeline-background {
        background: rgb(243,222,200) !important;
    }
    .CodeMirror-sizer{
        padding-right: 16px !important;
        padding-bottom: 7px;
        box-sizing: border-box !important;
        width: 100% !important;
        min-width: 100% !important;
        padding-left: 8px;
    }
    .editormd-preview-close-btn {
        display: none !important;
    }
</style>