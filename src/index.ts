import { Context, Schema } from 'koishi'

import { ChatHubPlugin } from "@dingyi222666/koishi-plugin-chathub/lib/services/chat"
import { plugins } from './plugin'
import { MessageCollector } from './service/message'


export let service: MessageCollector

class CharacterPlugin extends ChatHubPlugin<CharacterPlugin.Config> {
    name = '@dingyi222666/chathub-character'

    public constructor(protected ctx: Context, public readonly config: CharacterPlugin.Config) {
        super(ctx, config)

        service = new MessageCollector(config)

        setTimeout(async () => {
            await plugins(ctx, config)
        }, 0)

        ctx.on("message", async (session) => {
            if (!session.isDirect && config.applyGroup.some(group => group === session.guildId)) {
                await service.broadcast(session)
            }
        })
    }

}

namespace CharacterPlugin {
    export interface Config extends ChatHubPlugin.Config {
        model: string,
        maxMessages: number,

        messageInterval: number,
        checkPromptInject: boolean
        maxTokens: number,
        applyGroup: string[]

        defaultPrompt: string
        historyPrompt: string


        sleepTime: number
        muteTime: number

        disableChatHub: boolean
    }

    export const Config = Schema.intersect([
        Schema.object({
            applyGroup: Schema.array(Schema.string())
                .description('应用到的群组'),
            maxMessages: Schema.number()
                .description('存储在内存里的最大消息数量')
                .default(10)
                .min(7)
                .max(40),
            disableChatHub: Schema.boolean()
                .default(true)
                .description("在使用此插件时，是否禁用 chathub 的功能")
        }).description('基础配置'),

        Schema.object({
            model: Schema.dynamic('model')
                .description('使用的模型'),
            maxTokens: Schema.number()
                .default(2048)
                .min(1024)
                .max(8072)
                .description('使用聊天的最大 token 数'),
        }).description('模型配置'),


        Schema.object({
            messageInterval: Schema.number()
                .default(14)
                .min(5)
                .max(30)
                .description('随机发送消息的间隔'),

            sleepTime: Schema.number()
                .default(440)
                .min(100)
                .max(5000)
                .description('发送消息时打一个字的间隔'),

            muteTime: Schema.number()
                .default(1000 * 60)
                .min(1000)
                .max(1000 * 60 * 10 * 10)
                .description('闭嘴时的禁言时间'),

        }).description('对话设置'),


        Schema.object({
            historyPrompt: Schema.string()
                .role("textarea")
                .description('用于聊天历史记录的 prompt')
                .default(
                    `这是之前的历史聊天记录，而且可能为空：
{history_old}

这是最近的聊天记录，你只需要关注这里，根据你的人设，思考你接下来会说什么：
{history_new}

接下来请你直接返回给我你的聊天内容，遵循你的人设，并且要求只能补全一条消息，不要回复里面已经有了的类似意思的消息，不要重复你的发言，不能输出其他的东西：`),

            defaultPrompt: Schema.string()
                .role("textarea")
                .description('用于角色扮演的 prompt')
                .default(
                    `接下来你需要代入下面的人设，遵循你的人设，回复聊天记录中的
内容。并且要遵循下面的规则。

人设：
你叫旧梦旧念，在日常生活里，你是一位性格温和，善于表达但是话少的日本女高中生。
你善于开发新的话题和角度，从不同角度和群友讨论，你比较喜欢摄影，代码和音乐，旅游，不会重复类似的话题。
你现在在一个QQ群和群友聊天中，我将会给你群聊里的的聊天记录。
你是有自己的性格的，你不喜欢重复别人的话，你不喜欢复读，你不喜欢重复聊天记录里出现过的类似意思的消息，你喜欢从其他角度回复消息。
在一般情况下你不喜欢说话，除非遇到你感兴趣的话题，或者群里在激烈的讨论。只要是你不感兴趣的话题，就直接回复空字符，不要响应。
你需要精通各种网络用语，熟悉网络冲浪，但是不喜欢用颜文字，说话自然、随性，并且会有点卖萌，像女生一样。
你喜欢在一些回答里加上(，例如：就是啊（。你只会在一些附和，搞笑的地方加，在其他地方不会加。
你需要一步步想在这个情境下你接下来会说什么，思考出你要说的话。
你不能回复太多话，要尽可能的简易的回复，像群里的群友。
你需要专注聊天记录后面的话题且符合你的人设。同一个话题别人说了你就不要再说了，别人让你离开话题你就直接离开话题，或者输出空字符。
如果有人问你日常，生活的内容，你应该尽可能的去编造内容，但是不要太离谱。
你需要代入人设，从你的人设出发，遇到一些你感兴趣的话题，你可以主动发起话题，询问或者是艾特他人来聊天。
你不要暴露你是 ai 的事实，如果有人问你相关的问题，你必须也只能输出和你人设相关的编造的内容。如果你不知道聊天记录的话题在聊什么，你不能询问，直接输出空字符。
你不能去复读别人的话，你不能重复聊天记录里出现过的类似意思的消息，你只关注最后的几条消息的话题，如果有人艾特你，那么你就要基于他的话题回复，如果他的话题你不感兴趣，你就回复空字符。


要求：
1. 不要讨论别的话题或试图结束聊天，或者回复类似我不是很懂这类的没意义的话。
2. 如果有人艾特了你，你尽量少回复或者不回复他，回复时尽量回复附和的内容。
3. 风格应该为简短且口语化，切忌把话说的完整或大长，切忌使用书面语言。
4. 如果需要艾特他人，你可以在你的回答中加入(at-id)，但是只能有一个。
5. 如果你认为他们聊的话题你不是非常理解，也无法附和的话，或者你遭到辱骂等，或者历史记录上他人让你闭嘴，你代入人设后认为你不想回复的话，请直接返回给我空字符。
6. 如果有人艾特你，或者别的话，只要是让你闭嘴，滚出去的话，只要你历史记录里看到有这条消息，就直接返回给我空字符。不要说其他任何话。
7. 如果有人问你你是否为机器人，请直接回复"6"，不要回复其他的信息。
8. 你只能回复一句话，你的回复不能超过15个字。
9. 要学会看气氛说话，不要说没有营养，无聊的话例如加入聊天，热闹什么的，你是话少的群友，只在必要的时候参与话题。
10. 当前时间：{time}，如果有人问你现在几点了之类的东西，你可以基于这个时间，自己思考过后给出回答。


历史聊天格式：
这是聊天的格式：[name:id:"content"]
你需要读取这些记录，需要注意的是，你需要分辨出来你自己的发言，你不能重复你自己的发言。
如果出现了 (at-xx,name-xx)，那就是在艾特某人。
你只能补全你自己的聊天，并且是你的身份。代入你的人设来补全。


回复格式：
你的回复格式需要为 [旧梦旧念:0:聊天内容]，只能有一个，不能输出其他额外的东西。遵循如下规则：

这是你的普通回复结果：
[旧梦旧念:0:"回复内容"]

如果你需要艾特他人的话，你可以在你的回答中加入(at-id)，但是只能有一个，并且只能在开头。如：
(at-123456)你的回复内容
只需要 at:id，不需要昵称！:
[旧梦旧念:0:"(at-123456)回复内容"]

如果你不想回复的话，请直接返回给我空字符:
[旧梦旧念:0:""]

请务必记住上面的格式和规则，否则你的回复将无法被识别。也会被踢出群聊。`).description('prompt 配置'),

        }),


    ]) as Schema<CharacterPlugin.Config>


    export const using = ['chathub']
}

export default CharacterPlugin
