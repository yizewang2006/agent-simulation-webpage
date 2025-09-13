package behavior;

public class Constraint 
{
	//Max min can change in one time step
	public double max_increase;
	public double max_decrease;
	
	//Max min interval
	public double max_value;
	public double min_value;
	
	public int property_ID;
	
	public Constraint(int property_ID, double max_ins, double max_des, double max_v, double min_v)
	{
		this.property_ID = property_ID;
		
		this.max_increase = max_ins;
		
		this.max_decrease = max_des;
		
		this.max_value = max_v;
		
		this.min_value = min_v;
	}
}
