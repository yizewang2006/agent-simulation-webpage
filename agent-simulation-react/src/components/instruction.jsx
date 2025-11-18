import './instruction.css';
// defines a small instruction text that shows up in the control panel

// only renders instructionSmall if smallText is provided
export default function Instruction({ bigText, smallText }) {
    if (smallText == null) {
        return (
            <div className="instructionTextContainer">
                <div className="instructionBig">{bigText}</div>    
            </div>
        );
    }
    return (
        <div className="instructionTextContainer">
            <div className="instructionBig">{bigText}</div>    
            <div className="instructionSmall">{smallText}</div>
        </div>
    );
}