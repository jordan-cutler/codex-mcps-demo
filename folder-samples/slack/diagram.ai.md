After analyzing the provided code, I'll create a Mermaid.js diagram for the Slack MCP Server architecture:

flowchart TD
    %% External Entities
    SlackAPI["Slack API"]:::externalAPI
    LLM["LLM Client"]:::externalSystem

    %% Main Components
    subgraph "MCP Server"
        Server["Server Component"]:::serverComponent
        Transport["StdioServerTransport"]:::transport
        ToolRegistry["Tool Registry"]:::registry

        subgraph "Request Handlers"
            CallToolHandler["CallTool Request Handler"]:::handler
            ListToolsHandler["ListTools Request Handler"]:::handler
        end

        subgraph "Tool Definitions"
            ListChannelsTool["slack_list_channels"]:::tool
            PostMessageTool["slack_post_message"]:::tool
            ReplyToThreadTool["slack_reply_to_thread"]:::tool
            AddReactionTool["slack_add_reaction"]:::tool
            ChannelHistoryTool["slack_get_channel_history"]:::tool
            ThreadRepliesTool["slack_get_thread_replies"]:::tool
            UsersTool["slack_get_users"]:::tool
            UserProfileTool["slack_get_user_profile"]:::tool
        end

        subgraph "Type Definitions"
            ArgInterfaces["Tool Argument Interfaces"]:::type
        end

        subgraph "Configuration"
            EnvVars["Environment Variables"]:::config
        end

        subgraph "Error Handling"
            ErrorModule["Error Handling Logic"]:::error
        end

        subgraph "Slack Client Layer"
            SlackClient["SlackClient Class"]:::client
            
            subgraph "Authentication"
                TokenAuth["Token Authentication"]:::auth
            end
            
            subgraph "API Wrapper Methods"
                GetChannels["getChannels()"]:::method
                PostMessage["postMessage()"]:::method
                PostReply["postReply()"]:::method
                AddReaction["addReaction()"]:::method
                GetHistory["getChannelHistory()"]:::method
                GetReplies["getThreadReplies()"]:::method
                GetUsers["getUsers()"]:::method
                GetProfile["getUserProfile()"]:::method
            end
        end

        subgraph "Response Formatting"
            JSONResponse["JSON Response Formatting"]:::formatter
        end
    end

    subgraph "Docker Container"
        NodeJS["Node.js Runtime"]:::runtime
        NPM["NPM Dependencies"]:::dependencies
        DockerEntrypoint["Container Entrypoint"]:::entrypoint
    end

    %% Connections
    LLM -->|"sends requests"| Transport
    Transport -->|"passes messages to"| Server
    Server -->|"registers"| ToolRegistry
    Server -->|"sets up"| CallToolHandler
    Server -->|"sets up"| ListToolsHandler
    
    CallToolHandler -->|"handles"| SlackClient
    ListToolsHandler -->|"returns"| ToolRegistry
    
    SlackClient -->|"uses"| TokenAuth
    SlackClient -->|"contains"| GetChannels
    SlackClient -->|"contains"| PostMessage
    SlackClient -->|"contains"| PostReply
    SlackClient -->|"contains"| AddReaction
    SlackClient -->|"contains"| GetHistory
    SlackClient -->|"contains"| GetReplies
    SlackClient -->|"contains"| GetUsers
    SlackClient -->|"contains"| GetProfile
    
    GetChannels -->|"calls"| SlackAPI
    PostMessage -->|"calls"| SlackAPI
    PostReply -->|"calls"| SlackAPI
    AddReaction -->|"calls"| SlackAPI
    GetHistory -->|"calls"| SlackAPI
    GetReplies -->|"calls"| SlackAPI
    GetUsers -->|"calls"| SlackAPI
    GetProfile -->|"calls"| SlackAPI
    
    CallToolHandler -->|"uses"| ErrorModule
    CallToolHandler -->|"formats with"| JSONResponse
    
    ToolRegistry -->|"contains"| ListChannelsTool
    ToolRegistry -->|"contains"| PostMessageTool
    ToolRegistry -->|"contains"| ReplyToThreadTool
    ToolRegistry -->|"contains"| AddReactionTool
    ToolRegistry -->|"contains"| ChannelHistoryTool
    ToolRegistry -->|"contains"| ThreadRepliesTool
    ToolRegistry -->|"contains"| UsersTool
    ToolRegistry -->|"contains"| UserProfileTool
    
    EnvVars -->|"provides config to"| SlackClient
    ArgInterfaces -->|"types for"| CallToolHandler
    
    DockerEntrypoint -->|"starts"| Server
    NodeJS -->|"runs"| Server
    NPM -->|"supports"| Server

    %% Click Events
    click Server "folder-samples/slack/index.ts"
    click Transport "folder-samples/slack/index.ts"
    click ToolRegistry "folder-samples/slack/index.ts"
    click CallToolHandler "folder-samples/slack/index.ts"
    click ListToolsHandler "folder-samples/slack/index.ts" 
    click ErrorModule "folder-samples/slack/index.ts"
    click SlackClient "folder-samples/slack/index.ts"
    click TokenAuth "folder-samples/slack/index.ts"
    click GetChannels "folder-samples/slack/index.ts"
    click PostMessage "folder-samples/slack/index.ts"
    click JSONResponse "folder-samples/slack/index.ts"
    click ArgInterfaces "folder-samples/slack/index.ts"
    click EnvVars "folder-samples/slack/index.ts"
    click ListChannelsTool "folder-samples/slack/index.ts"
    click PostMessageTool "folder-samples/slack/index.ts"
    click DockerEntrypoint "folder-samples/slack/Dockerfile"

    %% Styles
    classDef externalAPI fill:#f9a,stroke:#333,stroke-width:2px
    classDef externalSystem fill:#f9a,stroke:#333,stroke-width:2px
    classDef serverComponent fill:#9cf,stroke:#333,stroke-width:2px
    classDef transport fill:#9cf,stroke:#333,stroke-width:2px
    classDef registry fill:#bfb,stroke:#333,stroke-width:2px
    classDef handler fill:#bfb,stroke:#333,stroke-width:2px
    classDef tool fill:#fcf,stroke:#333,stroke-width:1px
    classDef type fill:#ccc,stroke:#333,stroke-width:1px
    classDef config fill:#ffc,stroke:#333,stroke-width:1px
    classDef error fill:#fcc,stroke:#333,stroke-width:1px
    classDef client fill:#bbf,stroke:#333,stroke-width:2px
    classDef auth fill:#ffc,stroke:#333,stroke-width:1px
    classDef method fill:#ddf,stroke:#333,stroke-width:1px
    classDef formatter fill:#dfd,stroke:#333,stroke-width:1px
    classDef runtime fill:#cfc,stroke:#333,stroke-width:1px
    classDef dependencies fill:#cfc,stroke:#333,stroke-width:1px
    classDef entrypoint fill:#cfc,stroke:#333,stroke-width:1px
