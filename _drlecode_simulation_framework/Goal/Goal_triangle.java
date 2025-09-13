package Goal;

import agents.Position;

public class Goal_triangle extends Goal
{
	public Position pos1;
	public Position pos2;
	public Position pos3;
	
	public Goal_triangle()
	{
		super(0);
	}
	
	public Goal_triangle(Position p1, Position p2, Position p3, double type)
	{
		super(type);
		this.pos1 = p1;
		this.pos2 = p2;
		this.pos3 = p3;
	}
}
