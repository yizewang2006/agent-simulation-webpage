package Utility;

import agents.Position;
import obstacles.Obstacle;

public class PositionAngle_DataStructure 
{
	public Position position;
	public int angle;
	public Obstacle o;
	public boolean intersect_in_corner;
	
	public PositionAngle_DataStructure(Position p, int a)
	{
		this.position = p;
		this.angle = a;
	}
}
