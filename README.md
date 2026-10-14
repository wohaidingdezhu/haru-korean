# HARU · 每天一点韩语

一个通过浏览器使用的韩语学习平台：以基础学习为主线，每天安排 1–2 句你喜欢的歌曲歌词，配合发音、跟读和 FSRS 间隔复习。默认练习歌曲是 TAEYANG 的《Wedding Dress》。

## 明天在另一台电脑启动

先安装 **Node.js 24 LTS** 和 Git；不需要 Python、数据库或 API Key。Windows、macOS、Linux 使用相同命令：

```sh
git clone https://github.com/wohaidingdezhu/haru-korean.git
cd haru-korean
npm ci
npm run build
npm run dev
```

打开 **http://127.0.0.1:4173**。如端口 4173 已被占用：

```sh
npm run dev -- --port 4174
```

启动后浏览器打开 http://127.0.0.1:4174 。停服务用 Ctrl+C。

首次使用：

1. 在「今日学习」完成一节基础小课。
2. 进入「歌曲工作台」→「导入 / 更换歌词」，粘贴手上的韩语歌词，或选 TXT / LRC / SRT 文件。每行是一句。
3. 默认每天 2 句，可在首页右上角的学习设置中改为 1 句。
4. MV 默认使用 Bilibili 内嵌播放器；也可以切换到 YouTube，或点击来源链接打开原页面。
5. **精确逐句循环与变速，请选择本地音频 / MP4 音轨**，设置 A、B 后播放。Bilibili 播放器本身不受本平台的 A–B 按钮控制。
6. 到复习页按真实记忆情况选择「忘记了 / 有点难 / 记得 / 很熟悉」。

## 换电脑时带走学习进度

进度、导入的歌词和笔记保存在**当前浏览器**，不会自动随 GitHub 同步。

- 旧电脑：首页底部「导出进度」，或学习设置「导出备份」。
- 新电脑：学习设置「恢复备份」，选择导出的 JSON 文件。
- 本地歌曲媒体不包含在备份中，需在新电脑重新选择。
- 尽量使用同一个本地地址；localhost 与 127.0.0.1 是不同的浏览器存储来源。

## 已实现

- 14 节原创起步小课：韩文字母、拼读、收音、连音、问候、介绍、基本句型与语序。小课包含练习和答错解释。这是**入门阶段**，不等同于完整的初级到高级课程。
- 每天 1–2 句新歌词；同一天刷新、修改句数不会不断追加新句。漏学后继续推进，不补一大堆新句。
- FSRS 复习卡；新学内容首先在次日到期，之后依据记忆评分安排复习。
- 普通每日任务、3 分钟轻量模式、学习天数记录。
- TXT / LRC / SRT 导入；时间轴字幕；本地媒体 A–B 循环和速度调整。
- JSON 进度备份 / 恢复、Anki TSV 卡片导出、SRT 导出。
- 桌面与手机布局；浏览器可用时提供韩语 TTS。

暂未实现云同步、自动歌词翻译、发音评分和定时提醒。YouTube/Bilibili 可用性仍取决于视频本身与访问网络；本地媒体练习不依赖这些服务。

## 开源项目如何复用

这是基于 **asbplayer 源代码的衍生学习入口**，没有重新编写并伪称整合：

- 完整上游源码快照保存在 `upstream/asbplayer/`，固定提交 `c8718d11f933f307088f2463c02e87a39cdc0571`，保留 AGPL-3.0-or-later 许可证。
- 运行代码直接导入上游的 `SubtitleCollection`，用于按音频时间显示字幕；直接导入 `subtitlesToSrt`，用于导出 SRT。这两个模块未修改。
- 中文学习界面、每日学习计划、课程、导入和进度管理是新增代码。没有内嵌完整的 asbplayer 浏览器扩展及原始 React 界面。
- FSRS 调度使用 [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)（MIT）。
- Anki 支持是 TSV 卡片导出接口；未复制 Anki 桌面客户端，也没有实时同步。

详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 开发与验证

```sh
npm test
npm run build
npm run dev
```

核心测试覆盖北京时间日界、每日额度与刷新、漏学后分配、FSRS 存档、字幕毫秒精度和循环边界。构建输出在 `dist/`。学习设置中的源码下载包含本版本应用与完整上游快照。

```
src/                 新增学习界面、课程和调度逻辑
public/              HTML、样式、许可证副本
upstream/asbplayer/  完整上游源码快照
scripts/             构建、本地服务、源码打包
tests/              核心行为测试
```

## 许可证与歌曲内容

应用及衍生代码采用 **AGPL-3.0-or-later**，见 [LICENSE](LICENSE)。保留上游署名和许可证；其他依赖继续适用各自许可。

仓库不包含《Wedding Dress》歌词、录音或用户进度。歌词由使用者在浏览器中导入，媒体在本机选择；运行时数据不上传到应用服务。主动加载外部播放器时，会访问对应的 Bilibili 或 YouTube 服务。
