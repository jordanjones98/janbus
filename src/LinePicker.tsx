import { useState } from "react";
import { Line } from "./types";

type LinePickerProps = {
  lines: Line[];
  onLineChange: (line: string) => void;
};

export default function LinePicker(props: LinePickerProps) {
  const [lines] = useState<Array<Line>>(props.lines);
  const [selectedLine, setSelectedLine] = useState<string>();

  /**
   * On line change set the line, and call the props line change function
   */
  function onLineChange(lineId: string) {
    setSelectedLine(lineId);
    props.onLineChange(lineId);
  }

  return (
    <div className="container mt-3">
      <div className="row justify-content-md-center">
        <div className="col-5">
          <select
            className="form-control"
            value={selectedLine}
            onChange={(e) => onLineChange(e.target.value)}
          >
            <>
              <option value="">Select Line</option>
              {lines &&
                lines.map((line, key) => {
                  return (
                    <option value={line.id} key={key}>
                      {line.name}
                    </option>
                  );
                })}
            </>
          </select>
        </div>
      </div>
      <div className="row justify-content-md-center">
        <div className="col-5 text-center">
          {selectedLine && (
            <button
              className="btn btn-primary mt-1"
              onClick={() => onLineChange("")}
            >
              Clear Line
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
