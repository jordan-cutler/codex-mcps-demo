flowchart TD
    %% Global entities
    MCP["Model Context Protocol"]:::protocol
    SlackAPI["Slack API"]:::external

    %% Main components
    subgraph "Server Layer"
        ServerCore["MCP Server Core"]:::core
        ServerInstance["Server Instance"]:::instance
        StdioTransport["StdioServerTransport"]:::transport
        ErrorHandling["Error Handling"]:::error
        EnvConfig["Environment Configuration"]:::config
    end

    subgraph "Request Handlers"
        ListToolsHandler["List Tools Handler"]:::handler
        CallToolHandler["Call Tool Handler"]:::handler
    end

    subgraph "Slack Tools"
        ListChannels["slack_list_channels Tool"]:::tool
        PostMessage["slack_post_message Tool"]:::tool
        ReplyThread["slack_reply_to_thread Tool"]:::tool
        AddReaction["slack_add_reaction Tool"]:::tool
        ChannelHistory["slack_get_channel_history Tool"]:::tool
        ThreadReplies["slack_get_thread_replies Tool"]:::tool
        GetUsers["slack_get_users Tool"]:::tool
        UserProfile["slack_get_user_profile Tool"]:::tool
    end
    
    subgraph "Slack Client"
        AuthModule["Authentication"]:::auth
        APIWrapper["API Wrapper Methods"]:::api
        ResponseHandler["Response Handling"]:::response
    end

    subgraph "Deployment"
        Docker["Deployment Containers"]:::deploy
    end

    %% Connections
    MCP -->|"provides protocol"| ServerCore
    ServerCore -->|"initializes"| ServerInstance
    ServerInstance -->|"connects to"| StdioTransport
    ServerInstance -->|"registers"| ListToolsHandler
    ServerInstance -->|"registers"| CallToolHandler
    EnvConfig -->|"configures"| ServerInstance
    EnvConfig -->|"configures"| AuthModule
    
    ListToolsHandler -->|"returns"| ListChannels
    ListToolsHandler -->|"returns"| PostMessage
    ListToolsHandler -->|"returns"| ReplyThread
    ListToolsHandler -->|"returns"| AddReaction
    ListToolsHandler -->|"returns"| ChannelHistory
    ListToolsHandler -->|"returns"| ThreadReplies
    ListToolsHandler -->|"returns"| GetUsers
    ListToolsHandler -->|"returns"| UserProfile
    
    CallToolHandler -->|"executes"| ListChannels
    CallToolHandler -->|"executes"| PostMessage
    CallToolHandler -->|"executes"| ReplyThread
    CallToolHandler -->|"executes"| AddReaction
    CallToolHandler -->|"executes"| ChannelHistory
    CallToolHandler -->|"executes"| ThreadReplies
    CallToolHandler -->|"executes"| GetUsers
    CallToolHandler -->|"executes"| UserProfile
    
    ListChannels -->|"calls"| APIWrapper
    PostMessage -->|"calls"| APIWrapper
    ReplyThread -->|"calls"| APIWrapper
    AddReaction -->|"calls"| APIWrapper
    ChannelHistory -->|"calls"| APIWrapper
    ThreadReplies -->|"calls"| APIWrapper
    GetUsers -->|"calls"| APIWrapper
    UserProfile -->|"calls"| APIWrapper
    
    AuthModule -->|"authenticates"| APIWrapper
    APIWrapper -->|"requests"| SlackAPI
    SlackAPI -->|"returns data to"| APIWrapper
    APIWrapper -->|"passes to"| ResponseHandler
    ErrorHandling -->|"handles errors in"| CallToolHandler
    Docker -->|"containerizes"| ServerCore

    %% Click events
    click ServerCore "folder-samples/slack/index.ts"
    click ServerInstance "folder-samples/slack/index.ts"
    click StdioTransport "folder-samples/slack/index.ts"
    click ErrorHandling "folder-samples/slack/index.ts"
    click EnvConfig "folder-samples/slack/index.ts"
    click ListToolsHandler "folder-samples/slack/index.ts"
    click CallToolHandler "folder-samples/slack/index.ts"
    click ListChannels "folder-samples/slack/index.ts"
    click PostMessage "folder-samples/slack/index.ts"
    click ReplyThread "folder-samples/slack/index.ts"
    click AddReaction "folder-samples/slack/index.ts"
    click ChannelHistory "folder-samples/slack/index.ts"
    click ThreadReplies "folder-samples/slack/index.ts"
    click GetUsers "folder-samples/slack/index.ts"
    click UserProfile "folder-samples/slack/index.ts"
    click AuthModule "folder-samples/slack/index.ts"
    click APIWrapper "folder-samples/slack/index.ts"
    click ResponseHandler "folder-samples/slack/index.ts"
    click Docker "folder-samples/slack/Dockerfile"

    %% Styles
    classDef protocol fill:#c9e4de,stroke:#000,stroke-width:1px
    classDef external fill:#f6c5af,stroke:#000,stroke-width:1px
    classDef core fill:#fcbf49,stroke:#000,stroke-width:1px
    classDef instance fill:#a7c957,stroke:#000,stroke-width:1px
    classDef transport fill:#a0c4ff,stroke:#000,stroke-width:1px
    classDef error fill:#f28482,stroke:#000,stroke-width:1px
    classDef config fill:#06d6a0,stroke:#000,stroke-width:1px
    classDef handler fill:#ffd166,stroke:#000,stroke-width:1px
    classDef tool fill:#cdb4db,stroke:#000,stroke-width:1px
    classDef auth fill:#8ecae6,stroke:#000,stroke-width:1px
    classDef api fill:#bdb2ff,stroke:#000,stroke-width:1px
    classDef response fill:#ffafcc,stroke:#000,stroke-width:1px
    classDef deploy fill:#f4a261,stroke:#000,stroke-width:1px