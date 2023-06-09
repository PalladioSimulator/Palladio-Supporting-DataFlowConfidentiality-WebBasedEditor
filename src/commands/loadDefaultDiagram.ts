import { inject, injectable } from "inversify";
import {
    ActionDispatcher,
    Command,
    CommandExecutionContext,
    CommandReturn,
    EMPTY_ROOT,
    ILogger,
    NullLogger,
    SModelRoot,
    TYPES,
} from "sprotty";
import { Action, SGraph as SGraphSchema, SEdge as SEdgeSchema } from "sprotty-protocol";
import { DynamicChildrenProcessor } from "../dynamicChildren";
import { DFDNodeSchema } from "../views";
import { generateRandomSprottyId } from "../utils";
import { fitToScreenAfterLoad } from "./load";

const storageId = generateRandomSprottyId();
const functionId = generateRandomSprottyId();
const outputId = generateRandomSprottyId();

const defaultDiagramSchema: SGraphSchema = {
    type: "graph",
    id: "root",
    children: [
        {
            type: "node:storage",
            id: storageId,
            text: "Database",
            position: { x: 100, y: 100 },
        } as DFDNodeSchema,
        {
            type: "node:function",
            id: functionId,
            text: "System",
            position: { x: 200, y: 200 },
        } as DFDNodeSchema,
        {
            type: "node:input-output",
            id: outputId,
            text: "Customer",
            position: { x: 325, y: 206 },
        } as DFDNodeSchema,
        {
            type: "edge:arrow",
            id: generateRandomSprottyId(),
            sourceId: storageId,
            targetId: functionId,
            text: "Read",
        } as SEdgeSchema,
        {
            type: "edge:arrow",
            id: generateRandomSprottyId(),
            sourceId: functionId,
            targetId: outputId,
        } as SEdgeSchema,
    ],
};

export interface LoadDefaultDiagramAction extends Action {
    readonly kind: typeof LoadDefaultDiagramAction.KIND;
}
export namespace LoadDefaultDiagramAction {
    export const KIND = "loadDefaultDiagram";

    export function create(): LoadDefaultDiagramAction {
        return {
            kind: KIND,
        };
    }
}

@injectable()
export class LoadDefaultDiagramCommand extends Command {
    static readonly KIND = LoadDefaultDiagramAction.KIND;
    @inject(TYPES.ILogger)
    private readonly logger: ILogger = new NullLogger();
    @inject(DynamicChildrenProcessor)
    private readonly dynamicChildrenProcessor: DynamicChildrenProcessor = new DynamicChildrenProcessor();
    @inject(TYPES.IActionDispatcher)
    private readonly actionDispatcher: ActionDispatcher = new ActionDispatcher();

    private oldRoot: SModelRoot | undefined;
    private newRoot: SModelRoot | undefined;

    execute(context: CommandExecutionContext): CommandReturn {
        this.oldRoot = context.root;

        const graphCopy = JSON.parse(JSON.stringify(defaultDiagramSchema));
        this.dynamicChildrenProcessor.processGraphChildren(graphCopy, "set");
        this.newRoot = context.modelFactory.createRoot(graphCopy);

        this.logger.info(this, "Default Model loaded successfully");
        fitToScreenAfterLoad(this.newRoot, this.actionDispatcher);
        return this.newRoot;
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.newRoot ?? this.oldRoot ?? context.modelFactory.createRoot(EMPTY_ROOT);
    }
}
