package zones;

import agents.Position;

public class Zone 
{
	
	public double ID;
	public double type;
	public int pre_set_heading = 0;
	
	public Zone()
	{
		type = 0;
	}
	
	//A rectangle shape needs a UP LEFT position, width and height values
	public Zone(double t)
	{
		type = t;
	
	}
	
}
