package zones;

import agents.Position;

public class Zone_rectangle extends Zone
{
	public Position pos1;
	public Position pos2;
	public Position pos3;
	public Position pos4;
	public int width;
	public int height;
	
	public Zone_rectangle()
	{
		super(0);
		this.pos1 = null;
		this.pos2 = null;
		this.pos3 = null;
		this.pos4 = null;
	}
	
	//A rectangle shape needs a UP LEFT position, width and height values
	public Zone_rectangle(double ID, Position p, int w, int h)
	{
		super(0);
		this.ID = ID;
		this.pos1 = p;
		this.width = w;
		this.height = h;
		
		this.pos2 = new Position(pos1.x + w, pos1.y);
		this.pos3 = new Position(pos1.x + w, pos1.y + h);
		this.pos4 = new Position(pos1.x, pos1.y + h);
	}
	
	//For now, only works for rectangle or square
	public double upperB()
	{
		double upperB = 0;

		if (pos1.y == pos2.y)
		{
			upperB = pos1.y;
		}

		return upperB;
	}

	public double lowerB()
	{
		double lowerB = 0;

		if (pos3.y == pos4.y)
		{
			lowerB = pos3.y;
		}
		return lowerB;
	}

	public double rightB()
	{
		double rightB = 0;

		if (pos2.x == pos3.x)
		{
			rightB = pos2.x;
		}
		return rightB;
	}

	public double leftB()
	{
		double leftB = 0;

		if (pos4.x == pos1.x)
		{
			leftB = pos4.x;
		}
		return leftB;
	}
	
	
	public boolean inside(Position target_pos)
	{
		if (target_pos.x > pos1.x && target_pos.x < pos2.x && target_pos.y > pos1.y && target_pos.y < pos4.y)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
}
