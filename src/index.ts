/**
 * 库的摘要信息
 * 
 * @remarks
 * 库的说明信息
 * 
 * @packageDocumentation
 */


 import { selectFiles, OpenFilesOptions } from "web-tls";
 import { UpFile, ByUploader } from 'by-uploader';
 
 /**
  * 绑定选项
  */
 export interface IBindOptions<F extends UpFile = UpFile> {
   setFileList?: (files: F[]) => void;
   setProgress?: (progress: number) => void;
   setTotalSize?: (size: number) => void;
   setUploadedSize?: (size: number) => void;
   setChangeId?: (id: number) => void;
 }
 
 export interface AppendFilesOptions extends OpenFilesOptions {
   // 给文件对像添加额外的属性
   extra?: any;
 }
 
 export interface IUploadViewController<F extends UpFile = UpFile> {
   // ByUploader 实例，用于上传的
   uploader: ByUploader;
 
   /**
    * 追加文件
    */
   appendFiles(options?: AppendFilesOptions | null): Promise<File[]>;
 
   /**
    * 解决 uploader 和  IBindOptions 的绑定
    */
   unbind(): void;
 
   /**
    * 上传所有的文件
    */
   uploadAll(): boolean;
 
   /**
    * 移除所有的文件
    */
   removeAll(): void;
 
   /**
    * 刷新文件列表
    */
   refreshFileList(): F[];
 
   /**
    * 刷新进度
    */
   refreshProgress(): {
     total: number;
     uploaded: number;
     progress: number;
   };
 }
 
 /**
  * 绑定 ByUploader 和 业务数据
  * @param uploader
  * @param options
  * @returns
  */
 export function bindUploader<F extends UpFile = UpFile>(
   uploader: ByUploader,
   options: IBindOptions<F>,
 ): IUploadViewController<F> {
   const {
     setFileList,
     setProgress,
     setTotalSize,
     setUploadedSize,
     setChangeId,
   } = options;
   let id = 0;
   function changed() {
     id++;
     setChangeId?.(id);
   }
   function refreshFileList() {
     const fileList = [...(uploader.items as F[])];
     setFileList?.(fileList);
     refreshProgress();
     changed();
     return fileList;
   }
 
   function refreshProgress() {
     const { totalSize, uploadedSize } = uploader;
     const progress = uploadedSize / totalSize;
     setTotalSize?.(totalSize);
     setUploadedSize?.(uploadedSize);
     setProgress?.(progress);
     changed();
     return {
       total: totalSize,
       uploaded: uploadedSize,
       progress,
     };
   }
 
   const controller = new AbortController();
   const signal = controller.signal;
 
   //  添加事件监听器
   uploader.addEventListener('addItem', refreshFileList, { signal });
   uploader.addEventListener('abort', refreshFileList, { signal });
   uploader.addEventListener('removeItem', refreshFileList, { signal });
   uploader.addEventListener('progress', refreshProgress, { signal });
   uploader.addEventListener('itemStart', refreshProgress, { signal });
   uploader.addEventListener('itemPause', refreshProgress, { signal });
 
   /**
    * 解绑定
    */
   function unbind() {
     controller.abort();
   }
 
   /**
    * 打开文件选择窗口，进行追加文件
    * @returns
    */
   async function appendFiles(options?: AppendFilesOptions | null) {
     const { extra, ...openOpts } = options || {};
     const fileList = await selectFiles(openOpts);
     for (const file of fileList) {
       if (extra) {
         Object.assign(file, extra);
       }
       uploader.addFile(file);
     }
     return fileList;
   }
 
   /**
    * 开始上传文件
    */
   function uploadAll() {
     return uploader.start();
   }
 
   /**
    * 移除所有文件
    * @returns
    */
   function removeAll() {
     return uploader.removeAllFile();
   }
 
   return {
     uploader,
     appendFiles,
     unbind,
     uploadAll,
     removeAll,
     refreshFileList,
     refreshProgress,
   };
 }
 
 /**
  * 创建上传视图模型
  */
 export function createUploadViewController(options: IBindOptions) {
   const uploader = new ByUploader();
   return bindUploader(uploader, options);
 }
 