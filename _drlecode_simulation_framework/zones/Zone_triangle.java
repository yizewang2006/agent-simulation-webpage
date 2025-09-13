package zones;

import java.util.ArrayList;

import agents.Position;

public class Zone_triangle extends Zone
{
	public Position pos1;
	public Position pos2;
	public Position pos3;
	public ArrayList<Position> pos_list = new ArrayList<Position>();
	
	public int[] x_list = new int[3];
	public int[] y_list = new int[3];
	
	public Zone_triangle()
	{
		super(0);
	}
	
	public Zone_triangle(Position p1, Position p2, Position p3, double type)
	{
		super(type);
		this.pos1 = p1;
		this.pos2 = p2;
		this.pos3 = p3;
		
		pos_list.add(p1);
		pos_list.add(p2);
		pos_list.add(p3);
		
		x_list[0] = (int) p1.x;
		x_list[1] = (int) p2.x;
		x_list[2] = (int) p3.x;
		
		y_list[0] = (int) p1.y;
		y_list[1] = (int) p2.y;
		y_list[2] = (int) p3.y;
		
		
	}
	
	public boolean inside(Position target_pos)
	{
		double A = area(pos1, pos2, pos3);
		double A1 = area(target_pos, pos2, pos3);
		double A2 = area(pos1, target_pos, pos3);
		double A3 = area(pos1, pos2, target_pos);
		
		double sum = A1 + A2 + A3;
		
		if (A > sum - 0.1 && A < sum + 0.1)
		{
			return true;
		}
		else
		{
			return false;
		}
	}
	
	public double area (Position p1, Position p2, Position p3)
	{
		 return Math.abs((p1.x*(p2.y-p3.y) + p2.x*(p3.y-p1.y)+
                 p3.x*(p1.y-p2.y))/2.0);
	}
}
