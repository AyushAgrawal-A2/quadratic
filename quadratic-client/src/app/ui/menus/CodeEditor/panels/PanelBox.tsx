import { CodeEditorPanelData } from '@/app/ui/menus/CodeEditor/panels/useCodeEditorPanelData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/shadcn/ui/collapsible';
import { ChevronRightIcon } from '@radix-ui/react-icons';

interface Props {
  title: string;
  component: any;
  index: number;
  codeEditorPanelData: CodeEditorPanelData;
}

export function PanelBox(props: Props) {
  const { title, component, index, codeEditorPanelData } = props;
  // const height = codeEditorPanelData.panelHeightPercentages[index];
  const open = !codeEditorPanelData.panelHidden[index];
  const setOpen = () => {
    codeEditorPanelData.setPanelHidden((prevState) => prevState.map((val, i) => (i === index ? !val : val)));
  };

  return (
    <Collapsible
      className={open ? 'h-full' : ''}
      // className="data-[state=open]:flex-growz flex flex-col relative"
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger className="flex w-full items-center gap-1 bg-background px-2 py-3 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-90">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="h-full overflow-scroll">{component}</CollapsibleContent>
    </Collapsible>
  );
}
