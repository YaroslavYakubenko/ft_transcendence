
export function sideChoice(pieceColor: "white" | "black" | "random"): "white" | "black"
{
	if (pieceColor === "random")
	{
		return Math.random() < 0.5 ? "white" : "black";
	}
	return pieceColor
}


