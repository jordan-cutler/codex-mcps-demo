Based on the information gathered, I'll create a Mermaid diagram that represents the Slack MCP Server architecture.

flowchart TD
    %% External Systems
    SlackAPI["Slack API"]:::external
    Client["Claude Model"]:::external
    
    %% Main Container
    subgraph "MCP Server Environment"
        %% Server Core Components
        Core["MCP Server Core"]:::core
        Transport["Transport Layer\n(StdioServerTransport)"]:::transport
        ErrorHandling["Error Handling"]:::utility
        
        %% Tool Registry and Handlers
        subgraph "Tool Management"
            ToolRegistry["Tool Registry"]:::registry
            ListTools["ListTools Handler"]:::handler
            CallTools["CallTools Handler"]:::handler
        end
        
        %% Tool Categories
        subgraph "Tool Categories"
            subgraph "Channel Tools"
                ListChannels["List Channels Tool"]:::tool
                ChannelHistory["Channel History Tool"]:::tool
                ThreadReplies["Thread Replies Tool"]:::tool
            end
            
            subgraph "Message Tools"
                PostMessage["Post Message Tool"]:::tool
                ReplyThread["Reply To Thread Tool"]:::tool
            end
            
            subgraph "Reaction Tools"
                AddReaction["Add Reaction Tool"]:::tool
            end
            
            subgraph "User Tools"
                GetUsers["Get Users Tool"]:::tool
                UserProfile["User Profile Tool"]:::tool
            end
        end
        
        %% Slack Client
        subgraph "Slack Client"
            Auth["Authentication"]:::auth
            
            subgraph "API Methods"
                ChannelAPI["Channel Methods"]:::api
                MessageAPI["Message Methods"]:::api
                ReactionAPI["Reaction Methods"]:::api
                UserAPI["User Methods"]:::api
            end
            
            ResponseHandling["Response Handling"]:::utility
        end
        
        %% Environment Configuration
        EnvConfig["Environment Configuration\n(Bot Token, Team ID)"]:::config
    end
    
    %% Docker Container
    DockerContainer["Docker Container"]:::infrastructure
    DeployConfig["Deployment Configuration"]:::infrastructure
    
    %% Connections
    Client -->|"1.Sends Requests"| Transport
    Transport -->|"2.Routes Requests"| Core
    Core -->|"3.Manages Tools"| ToolRegistry
    Core -->|"4.Handles Errors"| ErrorHandling
    
    ToolRegistry -->|"5.Lists Available Tools"| ListTools
    ToolRegistry -->|"6.Executes Tool Calls"| CallTools
    
    CallTools -->|"7.Invokes"| ChannelTools
    CallTools -->|"8.Invokes"| MessageTools
    CallTools -->|"9.Invokes"| ReactionTools
    CallTools -->|"10.Invokes"| UserTools
    
    ListChannels --> ChannelAPI
    ChannelHistory --> ChannelAPI
    ThreadReplies --> ChannelAPI
    PostMessage --> MessageAPI
    ReplyThread --> MessageAPI
    AddReaction --> ReactionAPI
    GetUsers --> UserAPI
    UserProfile --> UserAPI
    
    ChannelAPI -->|"11.Makes API Calls"| SlackAPI
    MessageAPI -->|"12.Makes API Calls"| SlackAPI
    ReactionAPI -->|"13.Makes API Calls"| SlackAPI
    UserAPI -->|"14.Makes API Calls"| SlackAPI
    
    SlackAPI -->|"15.Returns Data"| ResponseHandling
    ResponseHandling -->|"16.Formats Response"| CallTools
    
    EnvConfig -->|"17.Configures"| Auth
    Auth -->|"18.Authenticates"| SlackAPI
    
    DockerContainer -->|"19.Runs"| MCP Server Environment
    DeployConfig -->|"20.Configures"| DockerContainer
    
    %% Click Events
    click Core "folder-samples/slack/index.ts"
    click Transport "folder-samples/slack/index.ts"
    click ErrorHandling "folder-samples/slack/index.ts"
    click ToolRegistry "folder-samples/slack/index.ts"
    click ListTools "folder-samples/slack/index.ts"
    click CallTools "folder-samples/slack/index.ts"
    click ChannelTools "folder-samples/slack/index.ts"
    click MessageTools "folder-samples/slack/index.ts"
    click ReactionTools "folder-samples/slack/index.ts"
    click UserTools "folder-samples/slack/index.ts"
    click Auth "folder-samples/slack/index.ts"
    click API Methods "folder-samples/slack/index.ts"
    click ResponseHandling "folder-samples/slack/index.ts"
    click EnvConfig "folder-samples/slack/index.ts"
    click DockerContainer "folder-samples/slack/Dockerfile"
    click DeployConfig "folder-samples/slack/README.md"
    
    %% Styles
    classDef external fill:#f9f,stroke:#333,stroke-width:2px
    classDef core fill:#bbf,stroke:#33f,stroke-width:2px
    classDef transport fill:#bfb,stroke:#393,stroke-width:2px
    classDef registry fill:#fbb,stroke:#933,stroke-width:2px
    classDef handler fill:#fbf,stroke:#939,stroke-width:2px
    classDef tool fill:#bff,stroke:#399,stroke-width:2px
    classDef api fill:#ff9,stroke:#993,stroke-width:2px
    classDef auth fill:#9ff,stroke:#399,stroke-width:2px
    classDef utility fill:#ddd,stroke:#999,stroke-width:2px
    classDef config fill:#fdb,stroke:#975,stroke-width:2px
    classDef infrastructure fill:#ddf,stroke:#77c,stroke-width:2px
