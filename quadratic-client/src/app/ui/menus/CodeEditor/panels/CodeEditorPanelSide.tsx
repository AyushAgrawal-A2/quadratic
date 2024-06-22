import { codeCellIsAConnection } from '@/app/helpers/codeCellLanguage';
import { SchemaViewer } from '@/app/ui/connections/SchemaViewer';
import { AiAssistant } from '@/app/ui/menus/CodeEditor/AiAssistant';
import { Console } from '@/app/ui/menus/CodeEditor/Console';
import { PanelBox } from '@/app/ui/menus/CodeEditor/panels/PanelBox';
import { CodeEditorPanelData } from '@/app/ui/menus/CodeEditor/panels/useCodeEditorPanelData';
import { useRecoilValue } from 'recoil';
import { editorInteractionStateAtom } from '../../../../atoms/editorInteractionStateAtom';
import { ResizeControl } from './ResizeControl';
import { useCodeEditor } from '../CodeEditorContext';

interface Props {
  codeEditorPanelData: CodeEditorPanelData;
}

export function CodeEditorPanelSide(props: Props) {
  const { codeEditorPanelData } = props;
  const { containerRef } = useCodeEditor();
  const editorInteractionState = useRecoilValue(editorInteractionStateAtom);
  const isConnection = codeCellIsAConnection(editorInteractionState.mode);

  const panelHidden = codeEditorPanelData.panelHidden;
  const firstHidden = panelHidden[0];
  const secondHidden = panelHidden[1];
  const thirdHidden = panelHidden[2];

  // changes resize bar when dragging
  const changeResizeBar = (e: MouseEvent, first: boolean) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    // need to adjust the heights based on hidden content
    let height = containerRect.height;
    let clientY = e.clientY;

    if (first) {
      if (panelHidden[2]) {
        const panel2 = containerRef.current.querySelector('#panel-2');
        if (panel2) {
          const collapsedHeight = panel2.getBoundingClientRect().height;
          const expandedHeight = containerRect.height * (codeEditorPanelData.panelHeightPercentages[2] / 100);

          // todo: this is still not working :( ****

          // adjust height so it's the same as if the panel was expanded
          height = height - collapsedHeight + expandedHeight;

          // adjust mouse position to account for the total height difference
          console.log(
            expandedHeight - collapsedHeight,
            height / containerRect.height,
            (expandedHeight - collapsedHeight) * (containerRect.height / height)
          );
          clientY -= (expandedHeight - collapsedHeight) * (height / containerRect.height);
          // clientY -= (expandedHeight - collapsedHeight) * (height / containerRect.height);
        }
      }
      const newValue = ((clientY - containerRect.top) / height) * 100;
      codeEditorPanelData.adjustPanelPercentage(0, newValue);
    } else {
      if (panelHidden[0]) {
        const panel0 = containerRef.current.querySelector('#panel-0');
        if (panel0) {
          const collapsedHeight = panel0.getBoundingClientRect().height;
          const expandedHeight = containerRect.height * (codeEditorPanelData.panelHeightPercentages[0] / 100);

          // adjust height so it's the same as if the panel was expanded
          height = height - collapsedHeight + expandedHeight;
          clientY += collapsedHeight;
        }
      }
      const newValue = ((containerRect.bottom - clientY) / containerRect.height) * 100;
      codeEditorPanelData.adjustPanelPercentage(2, newValue);
    }
  };

  return (
    <div className="relative flex h-full flex-col">
      <PanelBox
        id="panel-0"
        title="Console"
        component={<Console />}
        index={0}
        codeEditorPanelData={codeEditorPanelData}
      />
      <ResizeControl
        style={{ position: 'relative' }}
        disabled={firstHidden || (secondHidden && thirdHidden)}
        position="HORIZONTAL"
        setState={(e) => changeResizeBar(e, true)}
      />
      <PanelBox
        id="panel-1"
        title="AI Assistant"
        component={<AiAssistant />}
        index={1}
        codeEditorPanelData={codeEditorPanelData}
      />
      {isConnection && (
        <ResizeControl
          style={{ position: 'relative', flexShrink: 0 }}
          disabled={secondHidden && thirdHidden}
          position="HORIZONTAL"
          setState={(e) => changeResizeBar(e, false)}
        />
      )}
      {isConnection && (
        <PanelBox
          id="panel-2"
          title="Data browser"
          component={<SchemaViewer />}
          index={2}
          codeEditorPanelData={codeEditorPanelData}
        />
      )}
    </div>
  );
}
