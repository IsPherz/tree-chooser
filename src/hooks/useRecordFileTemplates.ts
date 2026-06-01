import { useCallback, useState } from "react";
import {
  deleteRecordFileTemplate,
  listRecordFileTemplates,
  saveRecordFileTemplate,
  type RecordFileTemplate,
} from "../templates/recordFileTemplateStorage";

export function useRecordFileTemplates() {
  const [templates, setTemplates] = useState<RecordFileTemplate[]>(() => listRecordFileTemplates());

  const refreshTemplates = useCallback(() => {
    setTemplates(listRecordFileTemplates());
  }, []);

  const saveTemplate = useCallback(
    (name: string, fileText: string, lineCount: number) => {
      const saved = saveRecordFileTemplate(name, fileText, lineCount);
      refreshTemplates();
      return saved;
    },
    [refreshTemplates],
  );

  const removeTemplate = useCallback(
    (id: string) => {
      deleteRecordFileTemplate(id);
      refreshTemplates();
    },
    [refreshTemplates],
  );

  return {
    templates,
    refreshTemplates,
    saveTemplate,
    removeTemplate,
  };
}
