package agents;

public class Property_numeric extends Property
{

	public double lowerRange = 0;
	public double upperRange = 0;
	public double interval = 0;
	
	public Property_numeric()
	{
		
	}
	
	public Property_numeric(double ID, double init_value,boolean p, boolean g, double lRange, double uRange, double value_interval)
	{
		super(ID,init_value,p,g);
		this.lowerRange = lRange;
		this.upperRange = uRange;
		this.interval = value_interval;
	}


}
