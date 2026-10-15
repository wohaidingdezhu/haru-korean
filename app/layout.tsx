import type {Metadata} from 'next';
export const metadata:Metadata={title:'HARU · 每天一点韩语',description:'韩语学习、每日历史与跨设备进度同步'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>;}
